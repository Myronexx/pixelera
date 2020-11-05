/*
 *
 * This WebSocket is used for connecting
 * to minecraft server.
 * The minecraft server can set pixels and report user logins
 * and more.
 *
 * @flow */


import WebSocket from 'ws';


import WebSocketEvents from './WebSocketEvents';
import webSockets from './websockets';
import { getIPFromRequest } from '../utils/ip';
import Minecraft from '../core/minecraft';
import { setPixelByCoords } from '../core/setPixel';
import { drawByCoords } from '../core/draw';
import logger from '../core/logger';
import { APISOCKET_KEY } from '../core/config';
import chatProvider from '../core/ChatProvider';

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;
  const { headers } = req;
  const ip = getIPFromRequest(req);

  if (!headers.authorization
    || headers.authorization !== `Bearer ${APISOCKET_KEY}`) {
    logger.warn(`API ws request from ${ip} authenticated`);
    return done(false);
  }
  logger.warn(`API ws request from ${ip} successfully authenticated`);
  return done(true);
}


class APISocketServer extends WebSocketEvents {
  wss: WebSocket.Server;
  mc: Minecraft;

  constructor() {
    super();
    logger.info('Starting API websocket server');
    webSockets.addListener(this);

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/mcws",
      // server,
      noServer: true,
      verifyClient,
    });
    this.wss = wss;
    this.mc = new Minecraft();

    wss.on('error', (e) => {
      logger.error(`APIWebSocket Server Error ${e.message}`);
    });

    wss.on('connection', async (ws) => {
      ws.isAlive = true;
      ws.subChat = false;
      ws.subPxl = false;
      ws.subOnline = false;
      ws.on('pong', heartbeat);

      ws.on('message', (message) => {
        if (typeof message === 'string') {
          this.onTextMessage(message, ws);
        }
      });
    });

    this.ping = this.ping.bind(this);
    setInterval(this.ping, 45 * 1000);
  }

  broadcastChatMessage(
    name,
    msg,
    channelId,
    id,
    country,
    sendapi,
    ws = null,
  ) {
    if (!sendapi) return;

    const sendmsg = JSON.stringify(['msg', name, msg, country, channelId]);
    this.wss.clients.forEach((client) => {
      if (client !== ws
        && client.subChat
        && client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcastMinecraftLink(name, minecraftid, accepted) {
    const sendmsg = JSON.stringify(['linkver', minecraftid, name, accepted]);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcastMinecraftTP(minecraftid, x, y) {
    const sendmsg = JSON.stringify(['mctp', minecraftid, x, y]);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcastOnlineCounter(buffer) {
    const frame = WebSocket.Sender.frame(buffer, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    this.wss.clients.forEach((client) => {
      if (client.subOnline && client.readyState === WebSocket.OPEN) {
        frame.forEach((data) => {
          try {
            // eslint-disable-next-line no-underscore-dangle
            client._socket.write(data);
          } catch (error) {
            logger.error('(!) Catched error on write apisocket:', error);
          }
        });
      }
    });
  }

  broadcastPixelBuffer(canvasId, chunkid, buffer) {
    if (canvasId !== 0 && canvasId !== '0') return;
    const frame = WebSocket.Sender.frame(buffer, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    this.wss.clients.forEach((client) => {
      if (client.subPxl && client.readyState === WebSocket.OPEN) {
        frame.forEach((data) => {
          try {
            // eslint-disable-next-line no-underscore-dangle
            client._socket.write(data);
          } catch (error) {
            logger.error('(!) Catched error on write apisocket:', error);
          }
        });
      }
    });
  }

  async onTextMessage(message, ws) {
    try {
      const packet = JSON.parse(message);
      const command = packet[0];
      packet.shift();
      if (!command) {
        return;
      }
      if (command === 'sub') {
        const even = packet[0];
        if (even === 'chat') {
          ws.subChat = true;
        }
        if (even === 'pxl') {
          ws.subPxl = true;
        }
        if (even === 'online') {
          ws.subOnline = true;
        }
        logger.info(`APISocket client subscribed to  ${command}`);
        return;
      }
      if (command === 'setpxl') {
        const [minecraftid, ip, x, y, clr] = packet;
        if (clr < 0 || clr > 32) return;
        // be aware that user null has no cd
        if (!minecraftid && !ip) {
          setPixelByCoords('0', clr, x, y);
          ws.send(JSON.stringify(['retpxl', null, null, true, 0, 0]));
          return;
        }
        const user = this.mc.minecraftid2User(minecraftid);
        user.ip = ip;
        const {
          error, success, waitSeconds, coolDownSeconds,
        } = await drawByCoords(user, '0', clr, x, y, null);
        ws.send(JSON.stringify([
          'retpxl',
          (minecraftid) || ip,
          (error) || null,
          success,
          waitSeconds,
          (coolDownSeconds) || null,
        ]));
        return;
      }
      logger.info(`APISocket message  ${message}`);
      if (command === 'login') {
        const [minecraftid, minecraftname, ip] = packet;
        const user = await this.mc.reportLogin(minecraftid, minecraftname);
        // get userinfo
        user.ip = ip;
        const wait = await user.getWait(0);
        const waitSeconds = (wait) ? (wait - Date.now()) / 1000 : null;
        const name = (user.id == null) ? null : user.regUser.name;
        ws.send(JSON.stringify([
          'mcme',
          minecraftid,
          waitSeconds,
          name,
        ]));
        return;
      }
      if (command === 'userlst') {
        const [userlist] = packet;
        if (!Array.isArray(userlist) || !Array.isArray(userlist[0])) {
          logger.error('Got invalid minecraft userlist on APISocketServer');
          return;
        }
        this.mc.reportUserlist(userlist);
        return;
      }
      if (command === 'logout') {
        const [minecraftid] = packet;
        this.mc.reportLogout(minecraftid);
        return;
      }
      if (command === 'mcchat') {
        const [minecraftname, msg] = packet;
        const user = this.mc.minecraftname2User(minecraftname);
        const chatname = (user.id)
          ? `[MC] ${user.regUser.name}`
          : `[MC] ${minecraftname}`;
        chatProvider.broadcastChatMessage(
          chatname,
          msg,
          0,
          -1,
          'xx',
          false,
        );
        this.broadcastChatMessage(
          chatname,
          msg,
          0,
          -1,
          'xx',
          true,
          ws,
        );
        return;
      }
      if (command === 'chat') {
        const [name, msg, country, channelId] = packet;
        chatProvider.broadcastChatMessage(
          name,
          msg,
          channelId,
          -1,
          country,
          false,
        );
        this.broadcastChatMessage(
          name,
          msg,
          channelId,
          -1,
          country,
          true,
          ws,
        );
        return;
      }
      if (command === 'linkacc') {
        const [minecraftid, minecraftname, name] = packet;
        const ret = await Minecraft.linkacc(minecraftid, minecraftname, name);
        if (!ret) {
          webSockets.notifyChangedMe(name);
        }
        ws.send(JSON.stringify([
          'linkret',
          minecraftid,
          ret,
        ]));
      }
    } catch (err) {
      logger.error(`Got undecipherable api-ws message ${message}`);
    }
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping(() => {});
      return null;
    });
  }
}

export default APISocketServer;
