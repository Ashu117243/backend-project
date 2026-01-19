import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new mongoose.Schema(
  {
    // Basically Channel is also a user on the platform and subscriber is also a user
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // who is subscribing
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // which channel is getting subscribed
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("subscription", subscriptionSchema);
