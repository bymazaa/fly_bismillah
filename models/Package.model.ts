import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPackage extends Document {
  title: string;
  slug: string;
  price: number;
  image: string;
  // Updated Category Types matching frontend
  category: 'Hajj' | 'Umrah' | 'Islamic Tour' | 'Holiday' | 'Tour' | 'Travels' | 'Airlines' | 'Hotel' | 'Visa' | 'Others';
  location: string;
  description: string;
  included: string[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema<IPackage> = new Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'], 
      trim: true,
      unique: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      index: true 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'] 
    },
    image: { 
      type: String, 
      required: [true, 'Image is required'] 
    },
    category: { 
      type: String, 
      required: [true, 'Category is required'],
      // Updated Enum List
      enum: [
        'Hajj', 
        'Umrah', 
        'Islamic Tour', 
        'Holiday', 
        'Tour', 
        'Travels', 
        'Airlines', 
        'Hotel', 
        'Visa', 
        'Others'
      ]
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    included: { 
      type: [String], 
      default: [] 
    },
    isFeatured: {
      type: Boolean,
      default: true // Changed to true so packages are "Published" by default
    }
  },
  { timestamps: true }
);

// Prevent model overwrite in dev mode
const Package: Model<IPackage> = mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);

export default Package;