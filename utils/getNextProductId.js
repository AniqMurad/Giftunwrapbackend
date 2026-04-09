import Counter from "../models/Counter.js";

export const getNextProductId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "productId" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );

    return counter.value;
};