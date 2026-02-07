import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface IClick {
	timestamp: Date;
	ip?: string;
	userAgent?: string;
	referer?: string;
	country?: string;
	city?: string;
	device?: string;
	browser?: string;
	os?: string;
}

export interface IUrl extends Document {
	_id: mongoose.Types.ObjectId;
	shortCode: string;
	originalUrl: string;
	customSlug?: string;
	userId: Types.ObjectId;
	clicks: IClick[];
	clickCount: number;
	isActive: boolean;
	expiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const clickSchema = new Schema<IClick>(
	{
		timestamp: { type: Date, default: Date.now },
		ip: String,
		userAgent: String,
		referer: String,
		country: String,
		city: String,
		device: String,
		browser: String,
		os: String,
	},
	{ _id: false },
);

const urlSchema = new Schema<IUrl>(
	{
		shortCode: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		originalUrl: {
			type: String,
			required: true,
		},
		customSlug: {
			type: String,
			sparse: true,
			unique: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		clicks: [clickSchema],
		clickCount: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		expiresAt: {
			type: Date,
			// Note: TTL index is defined below with expireAfterSeconds
		},
	},
	{
		timestamps: true,
	},
);

// Compound index for fast lookups
urlSchema.index({ shortCode: 1, isActive: 1 });

// TTL index for automatic expiration (MongoDB handles deletion)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Url = mongoose.model<IUrl>("Url", urlSchema);
