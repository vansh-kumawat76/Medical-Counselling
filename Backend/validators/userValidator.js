const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// Counsellor Validation
const counsellorValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];


// Counselling Request Validation
const counsellingRequestValidator = [
  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic Year is required."),

  body("admissionLevel")
    .notEmpty()
    .withMessage("Admission Level is required.")
    .isIn(["UG", "PG", "Diploma", "Doctorate", "Other"])
    .withMessage("Please select a valid Admission Level."),

  body("preferredLocations")
    .isArray({ min: 1 })
    .withMessage("Preferred City is required."),

  body("preferredLocations.0.city")
    .isString()
    .withMessage("Preferred City is required.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Preferred City is required."),

  body("budget.min")
    .notEmpty()
    .withMessage("Minimum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Minimum Budget must be a valid non-negative number."),

  body("budget.max")
    .notEmpty()
    .withMessage("Maximum Budget is required.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Maximum Budget must be a valid non-negative number.")
    .bail()
    .custom((value, { req }) => {
      if (Number(value) < Number(req.body.budget?.min)) {
        throw new Error(
          "Maximum Budget cannot be less than Minimum Budget."
        );
      }
      return true;
    }),

  body("counsellingMode")
    .notEmpty()
    .withMessage("Counselling Mode is required.")
    .isIn(["phone", "video", "in_person", "chat"])
    .withMessage("Please select a valid Counselling Mode."),

  body("preferredTime.date")
    .notEmpty()
    .withMessage("Preferred Counselling Date is required.")
    .bail()
    .isISO8601()
    .withMessage("Please enter a valid counselling date.")
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Counselling date must be in the future.");
      }
      return true;
    }),
];


module.exports = {
  registerValidator,
  counsellorValidator,
  counsellingRequestValidator
};