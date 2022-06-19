/*
 * timers and cron for account related actions
 * @flow
 */

import Sequelize from 'sequelize';
import sequelize from '../data/sql/sequelize';
import RegUser from '../data/sql/RegUser';
import { saveDailyTop, loadDailyTop } from '../data/redis/PrevDayTop';
import logger from './logger';

import { MINUTE } from './constants';
import { DailyCron } from '../utils/cron';

class Ranks {
  ranks: Array;

  constructor() {
    this.updateRanking = this.updateRanking.bind(this);
    this.resetDailyRanking = this.resetDailyRanking.bind(this);
    this.prevTop = [];
    this.ranks = {
      dailyRanking: [],
      ranking: [],
    };
  }

  async initialize() {
    this.prevTop = await loadDailyTop();
    setInterval(this.updateRanking, 5 * MINUTE);
    DailyCron.hook(this.resetDailyRanking);
  }

  async updateRanking() {
    logger.info('Update pixel rankings');
    // recalculate ranking column
    await sequelize.query(
      // eslint-disable-next-line max-len
      'SET @r=0; UPDATE Users SET ranking= @r:= (@r + 1) ORDER BY totalPixels DESC;',
    );
    await sequelize.query(
      // eslint-disable-next-line max-len
      'SET @r=0; UPDATE Users SET dailyRanking= @r:= (@r + 1) ORDER BY dailyTotalPixels DESC;',
    );
    // populate dictionaries
    const ranking = await RegUser.findAll({
      attributes: [
        'id',
        'name',
        'totalPixels',
        'ranking',
        'dailyRanking',
        'dailyTotalPixels',
        [
          Sequelize.fn(
            'DATEDIFF',
            Sequelize.literal('CURRENT_TIMESTAMP'),
            Sequelize.col('createdAt'),
          ),
          'age',
        ],
      ],
      limit: 100,
      where: { id: { [Sequelize.Op.notIn]: [51, 1] } },
      order: ['ranking'],
      raw: true,
    });
    const dailyRanking = await RegUser.findAll({
      attributes: [
        'id',
        'name',
        'totalPixels',
        'ranking',
        'dailyRanking',
        'dailyTotalPixels',
        [
          Sequelize.fn(
            'DATEDIFF',
            Sequelize.literal('CURRENT_TIMESTAMP'),
            Sequelize.col('createdAt'),
          ),
          'age',
        ],
      ],
      limit: 100,
      where: { id: { [Sequelize.Op.notIn]: [51, 1] } },
      order: ['dailyRanking'],
      raw: true,
    });
    this.ranks.ranking = ranking;
    this.ranks.dailyRanking = dailyRanking;
  }

  async resetDailyRanking() {
    this.prevTop = await saveDailyTop(this.ranks.dailyRanking);
    logger.info('Resetting Daily Ranking');
    await RegUser.update({ dailyTotalPixels: 0 }, { where: {} });
    await this.updateRanking();
  }
}


const rankings = new Ranks();
export default rankings;
