
/**
 * Represents a User.
 *
 * @typedef {Object} User
 * @property {string} username - The username of the user.
 * @property {string} email - The email of the user.
 * @property {string} password - The password of the user.
 * @property {Date} createdAt - The creation date of the user.
 * @property {Date} updatedAt - The last update date of the user.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Sets up the User schema using Mongoose.
 *
 * @returns {import('mongoose').Model} The User model.
 */
function setupUserSchema() {
    /**
     * Represents the schema for a User.
     * @type {mongoose.Schema}
     */
    const UserSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    }, { timestamps: true });

    /**
     * Hashes the user's password before saving.
     *
     * @param {Function} next - The callback function.
     */
    UserSchema.pre('save', async function hashPassword(next) {
        if (!this.isModified('password')) return next();
        try {
            this.password = await bcrypt.hash(this.password, 10);
            return next();
        } catch (error) {
            return next(error);
        }
    });

    /**
     * Compares the provided password with the user's stored password.
     *
     * @param {string} candidatePassword - The password to compare.
     * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
     */
    UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    };

    return mongoose.model('User', UserSchema);
}

const User = setupUserSchema();

module.exports = User;
