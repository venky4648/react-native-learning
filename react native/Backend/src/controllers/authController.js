const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '7d',
  });
};

// @desc    Register a new user (Sign Up)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name: name || '',
      email: email.toLowerCase(),
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token (Log In)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate/Register user via Microsoft Sign-In
// @route   POST /api/auth/microsoft
// @access  Public
const microsoftAuth = async (req, res) => {
  try {
    const { email, name, microsoftId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Microsoft email is required' });
    }

    let user = await User.findOne({
      $or: [{ microsoftId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Update microsoftId if user previously registered via email
      if (!user.microsoftId && microsoftId) {
        user.microsoftId = microsoftId;
        await user.save();
      }
    } else {
      // Create new Microsoft user
      user = await User.create({
        name: name || 'Microsoft User',
        email: email.toLowerCase(),
        microsoftId: microsoftId || null,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get authenticated user profile
// @route   GET /api/auth/profile
// @access  Private (Protected by JWT)
const getUserProfile = async (req, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      microsoftId: req.user.microsoftId,
      createdAt: req.user.createdAt,
    });
  } else {
    res.status(404).json({ message: 'User profile not found' });
  }
};

// @desc    Redirect to Microsoft Auth Endpoint
// @route   GET /api/auth/microsoft/login
// @access  Public
const microsoftLoginRedirect = (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'https://myfirstapp-backend-kfl7.onrender.com/api/auth/microsoft/callback';

  if (!clientId) {
    return res.status(500).json({ message: 'Server Configuration Error: MICROSOFT_CLIENT_ID is missing.' });
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent('openid profile email User.Read')}`;

  res.redirect(authUrl);
};

// @desc    Handle Microsoft OAuth redirect callback
// @route   GET /api/auth/microsoft/callback
// @access  Public
const microsoftCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      return res.status(400).json({ error, description: error_description });
    }

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is missing' });
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'https://myfirstapp-backend-kfl7.onrender.com/api/auth/microsoft/callback';

    if (!clientId) {
      return res.status(500).json({ message: 'Server Configuration Error: MICROSOFT_CLIENT_ID is missing.' });
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    if (clientSecret) params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('scope', 'openid profile email User.Read');

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange token');
    }

    const accessToken = tokenData.access_token;

    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const graphData = await graphResponse.json();
    if (!graphResponse.ok) {
      throw new Error('Failed to retrieve user profile from Graph API');
    }

    const email = graphData.mail || graphData.userPrincipalName;
    const name = graphData.displayName || 'Microsoft User';
    const microsoftId = graphData.id;

    if (!email) {
      throw new Error('Microsoft email is required');
    }

    let user = await User.findOne({
      $or: [{ microsoftId }, { email: email.toLowerCase() }],
    });

    if (user) {
      if (!user.microsoftId && microsoftId) {
        user.microsoftId = microsoftId;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        microsoftId,
      });
    }

    const token = generateToken(user._id);

    const appRedirectUrl = `myfirstapp://redirect?token=${token}&_id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;

    res.send(`
      <html>
        <head>
          <title>Redirecting...</title>
          <script>
            window.location.href = "${appRedirectUrl}";
          </script>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h3>Login Successful!</h3>
          <p>Redirecting you back to the app...</p>
          <a href="${appRedirectUrl}" style="color: #007AFF; text-decoration: none; font-weight: bold;">Click here if you are not redirected automatically</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Microsoft Callback Error:', error.message);
    res.status(500).send(`Authentication error: ${error.message}`);
  }
};

// @desc    Verify if email exists
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'Email not found in our database' });
    }

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the new password (pre-save hook will hash it!)
    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  microsoftAuth,
  getUserProfile,
  microsoftLoginRedirect,
  microsoftCallback,
  verifyEmail,
  resetPassword,
};
