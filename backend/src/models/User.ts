import bcrypt from "bcryptjs";
import mongoose, { type Document, Schema } from "mongoose";

export enum UserRole {
	USER = "user",
	ADMIN = "admin",
}

export enum AuthProvider {
	LOCAL = "local",
	ENTRA_ID = "entra_id",
}

export interface IUser extends Document {
	_id: mongoose.Types.ObjectId;
	name: string;
	email: string;
	password?: string;
	role: UserRole;
	authProvider: AuthProvider;
	azureId?: string;
	isSuspended: boolean;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		password: {
			type: String,
			required: function (this: IUser) {
				return this.authProvider === AuthProvider.LOCAL;
			},
			minlength: 8,
		},
		role: {
			type: String,
			enum: Object.values(UserRole),
			default: UserRole.USER,
		},
		authProvider: {
			type: String,
			enum: Object.values(AuthProvider),
			default: AuthProvider.LOCAL,
		},
		azureId: {
			type: String,
			sparse: true,
			unique: true,
		},
		isSuspended: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// Hash password before saving
userSchema.pre("save", async function () {
	if (!this.isModified("password") || !this.password) {
		return;
	}

	this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (
	candidatePassword: string,
): Promise<boolean> {
	if (!this.password) return false;
	return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
