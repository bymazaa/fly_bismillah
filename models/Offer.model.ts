import mongoose from 'mongoose';
const OfferSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      index: true 
    },
        description: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            required: true,
        },

        whatsappMessage: {
            type: String,
            required: true,
        },

        isLarge: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

const Offer = mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
export default Offer;
