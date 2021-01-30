/*
 * request password change
 * @flow
 */


import type { Request, Response } from 'express';

import { RegUser } from '../../../data/models';
import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(password, gettext) {
  const errors = [];

  const passworderror = gettext(validatePassword(password));
  if (passworderror) errors.push(passworderror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { password } = req.body;
  const { t, gettext } = req.ttag;
  const errors = await validate(password, gettext);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: [t`You are not authenticated.`],
    });
    return;
  }
  const { id } = user;

  const currentPassword = user.regUser.password;
  if (!currentPassword || !compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: [t`Incorrect password!`],
    });
    return;
  }

  req.logout();
  RegUser.destroy({ where: { id } });

  res.json({
    success: true,
  });
};
