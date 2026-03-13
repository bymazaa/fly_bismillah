import mongoose from "mongoose"
const DestinationSchema = new mongoose.Schema({

    
    slug: { 
        type: String, 
        required: true, 
        unique: true 
    },

    name: { 
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    

    reviews: { 
        type: Number, 
        default: 0 
    },
    rating: { 
        type: Number, 
        default: 5.0,
        min: 1,
        max: 5
    },
    
    image: { 
        type: String, 
        required: true 
    },
    gallery: [{ 
        type: String 
    }],
    

    description: { 
        type: String, 
        required: true 
    },
    bestTime: { 
        type: String 
    },
    currency: { 
        type: String 
    },
    language: { 
        type: String 
    },
    
   
    attractions: [{ 
        type: String 
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    }

}, { 
    timestamps: true 
});


const Destination= mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);
export default Destination;