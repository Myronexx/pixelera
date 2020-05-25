/* @flow */


import logger from './logger';
import redis from '../data/redis';
import User from '../data/models/User';
import webSockets from '../socket/websockets';

import { CHAT_CHANNELS } from './constants';

export class ChatProvider {
  /*
   * TODO:
   * history really be saved in redis
   */
  history: Array;

  constructor() {
    this.history = [];
    for (let i = 0; i < CHAT_CHANNELS.length; i += 1) {
      this.history.push([]);
    }
    this.caseCheck = /^[A-Z !.]*$/;
    this.cyrillic = new RegExp('[\u0436-\u043B]');
    this.filters = [
      {
        regexp: /ADMIN/gi,
        matches: 4,
      },
      {
        regexp: /ADMlN/gi,
        matches: 4,
      },
      {
        regexp: /ADMlN/gi,
        matches: 4,
      },
      {
        regexp: /FUCK/gi,
        matches: 4,
      },
    ];
    this.substitutes = [
      {
        regexp: /http[s]?:\/\/(old.)?pixelplanet\.fun\/#/g,
        replace: '#',
      },
    ];
    this.mutedCountries = [];
  }

  addMessage(name, message, country, channelId = 0) {
    const channelHistory = this.history[channelId];
    if (channelHistory.length > 20) {
      channelHistory.shift();
    }
    channelHistory.push([name, message, country]);
  }

  async sendMessage(user, message, channelId: number = 0) {
    const name = (user.regUser) ? user.regUser.name : null;
    const country = user.country || 'xx';
    let displayCountry = (name.endsWith('berg') || name.endsWith('stein'))
      ? 'il'
      : country;

    if (!name) {
      // eslint-disable-next-line max-len
      return 'Couldn\'t send your message, pls log out and back in again.';
    }
    if (!user.regUser.verified) {
      return 'Your mail has to be verified in order to chat';
    }
    if (name === 'Aquila') {
      displayCountry = 'ug';
    }

    if (message.length > 2
      && message === message.toUpperCase()
      && message !== message.toLowerCase()
    ) {
      return 'Stop shouting';
    }

    for (let i = 0; i < this.filters.length; i += 1) {
      const filter = this.filters[i];
      const count = (message.match(filter.regexp) || []).length;
      if (count >= filter.matches) {
        ChatProvider.mute(name, channelId, 30);
        return 'Ow no! Spam protection decided to mute you';
      }
    }

    for (let i = 0; i < this.substitutes.length; i += 1) {
      const subsitute = this.substitutes[i];
      message = message.replace(subsitute.regexp, subsitute.replace);
    }

    if (message.includes('http')) {
      return 'no shitty links pls';
    }

    if (message.length > 200) {
      // eslint-disable-next-line max-len
      return 'You can\'t send a message this long :(';
    }

    if (user.isAdmin() && message.charAt(0) === '/') {
      // admin commands
      const cmdArr = message.split(' ');
      const cmd = cmdArr[0].substr(1);
      const args = cmdArr.slice(1);
      if (cmd === 'mute') {
        const timeMin = Number(args.slice(-1));
        if (Number.isNaN(timeMin)) {
          return ChatProvider.mute(args.join(' '), channelId);
        }
        return ChatProvider.mute(
          args.slice(0, -1).join(' '),
          channelId,
          timeMin,
        );
      } if (cmd === 'unmute') {
        return ChatProvider.unmute(args.join(' '), channelId);
      } if (cmd === 'mutec' && args[0]) {
        const cc = args[0].toLowerCase();
        this.mutedCountries.push(cc);
        webSockets.broadcastChatMessage(
          'info',
          `Country ${cc} has been muted`,
          channelId,
        );
        return null;
      } if (cmd === 'unmutec' && args[0]) {
        const cc = args[0].toLowerCase();
        if (!this.mutedCountries.includes(cc)) {
          return `Country ${cc} is not muted`;
        }
        this.mutedCountries = this.mutedCountries.filter((c) => c !== cc);
        webSockets.broadcastChatMessage(
          'info',
          `Country ${cc} has been unmuted`,
          channelId,
        );
        return null;
      }
    }

    if (message.match(this.cyrillic) && channelId === 0) {
      return 'Please use int channel';
    }

    if (this.mutedCountries.includes(country)) {
      return 'Your country is temporary muted from chat';
    }

    const muted = await ChatProvider.checkIfMuted(user);
    if (muted === -1) {
      return 'You are permanently muted, join our discord to apppeal the mute';
    }
    if (muted > 0) {
      if (muted > 120) {
        const timeMin = Math.round(muted / 60);
        return `You are muted for another ${timeMin} minutes`;
      }
      return `You are muted for another ${muted} seconds`;
    }
    this.addMessage(name, message, displayCountry, channelId);
    webSockets.broadcastChatMessage(name, message, displayCountry, channelId);
    return null;
  }

  broadcastChatMessage(
    name,
    message,
    country: string = 'xx',
    channelId: number = 0,
    sendapi: boolean = true,
  ) {
    if (message.length > 250) {
      return;
    }
    this.addMessage(name, message, country, channelId);
    webSockets.broadcastChatMessage(name, message, country, channelId, sendapi);
  }

  static automute(name, channelId = 0) {
    ChatProvider.mute(name, channelId, 60);
    webSockets.broadcastChatMessage(
      'info',
      `${name} has been muted for spam for 60min`,
      channelId,
    );
  }

  static async checkIfMuted(user) {
    const key = `mute:${user.id}`;
    const ttl: number = await redis.ttlAsync(key);
    return ttl;
  }

  static async mute(plainName, channelId = 0, timeMin = null) {
    const name = (plainName.startsWith('@')) ? plainName.substr(1) : plainName;
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    if (timeMin) {
      const ttl = timeMin * 60;
      await redis.setAsync(key, '', 'EX', ttl);
      if (timeMin !== 600 && timeMin !== 60) {
        webSockets.broadcastChatMessage(
          'info',
          `${name} has been muted for ${timeMin}min`,
          channelId,
        );
      }
    } else {
      await redis.setAsync(key, '');
      webSockets.broadcastChatMessage(
        'info',
        `${name} has been muted forever`,
        channelId,
      );
    }
    logger.info(`Muted user ${id}`);
    return null;
  }

  static async unmute(plainName, channelId = 0) {
    const name = (plainName.startsWith('@')) ? plainName.substr(1) : plainName;
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    const delKeys = await redis.delAsync(key);
    if (delKeys !== 1) {
      return `User ${name} is not muted`;
    }
    webSockets.broadcastChatMessage(
      'info',
      `${name} has been unmuted`,
      channelId,
    );
    logger.info(`Unmuted user ${id}`);
    return null;
  }
}

const chatProvider = new ChatProvider();
export default chatProvider;
