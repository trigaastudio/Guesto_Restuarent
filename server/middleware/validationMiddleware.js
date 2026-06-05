import { check, validationResult } from 'express-validator';


const emailValidation = check('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format');

const passwordValidation = check('password')
  .notEmpty().withMessage('Password is required')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/)
  .withMessage('Password must be 8-64 characters and contain uppercase, lowercase, number, and special character');

const nameValidation = check('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .matches(/^[A-Za-z\s]{2,50}$/).withMessage('Name must be 2-50 characters and contain only letters and spaces');

const phoneValidation = check('phone')
  .trim()
  .notEmpty().withMessage('Phone is required')
  .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits');


export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

export const validateRegister = [
  nameValidation,
  emailValidation,
  phoneValidation,
  passwordValidation,
  validate
];

export const validateLogin = [
  emailValidation,
  check('password').notEmpty().withMessage('Password is required'),
  validate
];


export const validateOTPRegister = [
  check('userData.name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .matches(/^[A-Za-z\s]{2,50}$/).withMessage('Name must be 2-50 characters and contain only letters and spaces'),
  check('userData.email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  check('userData.phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),
  check('userData.password')
    .notEmpty().withMessage('Password is required')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/)
    .withMessage('Password must be 8-64 characters and contain uppercase, lowercase, number, and special character'),
  validate
];
