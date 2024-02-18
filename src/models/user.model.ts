import mongoose, { Document, Schema, mongo } from "mongoose";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVarified?: Date;
  avatar?: string;
  phone?: string;
  password?: string;
  role: string;
  refreshToken?: string[];
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordValid: (password: string) => Promise<boolean>;
}

export interface IUserPopulate  {
  avatar: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVarified: {
      type: Date,
    },
    avatar: {
      type: String,
      ref: "image",default: ""
    },
    phone: {
      type: String,
      required: false,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["guest", "user", "admin", "super-admin"],
      default: "user",
    },
    refreshToken: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// hash password before on save if modify the password.
userSchema.pre("save", async function (next) {
  if (this.password === undefined) return next();

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// function to check password validation
userSchema.methods.isPasswordValid = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// generate accessToken
userSchema.methods.generateAccessToken = function () {
  return JWT.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "15m",
    }
  );
};

// generate accessToken
userSchema.methods.generateRefreshToken = function () {
  return JWT.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "15d",
    }
  );
};

const UserModel = mongoose.model<IUser>("user", userSchema);

export { UserModel };
