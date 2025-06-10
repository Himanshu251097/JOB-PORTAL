import userModel from "../models/userModel.js";

export const registerController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // if (!name) {
    //   next("name is require");
    // }

    // if (!email) {
    //   next("email is require");
    // }

    // if (!password) {
    //   next("pass is require and must be greator than 6 character");
    // }

    // const existingUser = await userModel.findOne({ email });
    // if (existingUser) {
    //   next("Email already registerd ");
    // }

    const user = await userModel.create({ name, email, password });

    const token = user.createJWT();
    res.status(201).send({
      success: true,
      message: "User created successfully",
      user: {
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      next(`Please Provide all fields`);
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      next(`invalid username or password`);
    }
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      next(`invalid username or password`);
    }
    user.password = undefined;
    const token = user.createJWT();
    res.status(200).json({
      success: true,
      message: "login sucessfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};
