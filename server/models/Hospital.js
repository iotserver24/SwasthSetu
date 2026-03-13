import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const HospitalSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    city: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Government", "Private", "Trust/NGO", "Clinic", "Other"],
      default: "Private",
    },
  },
  { timestamps: true }
);

HospitalSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

HospitalSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("Hospital", HospitalSchema);
