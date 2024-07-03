/**
 * @fileoverview This file contains the controller functions for authentication.
 * @module controllers/authController
 */

const User = require('../models/User');

/**
 * Render the login page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

/**
 * Handle the login form submission.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.comparePassword(password)) {
            req.session.user = { id: user._id, username: user.username };
            res.redirect('/');
        } else {
            res.render('auth/login', { error: 'Invalid credentials', title: 'Login' });
        }
    } catch (error) {
        res.render('auth/login', { error: error.message, title: 'Login' });
    }
};

/**
 * Render the register page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.getRegister = (req, res) => {
    res.render('auth/register', { title: 'Register' });
};

/**
 * Handle the register form submission.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.postRegister = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = new User({ username, email, password });
        await user.save();
        res.redirect('/auth/login');
    } catch (error) {
        res.render('auth/register', { error: error.message, title: 'Register' });
    }
};

/**
 * Logout the user and destroy the session.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log('Error destroying session:', err);
        res.redirect('/auth/login');
    });
};
