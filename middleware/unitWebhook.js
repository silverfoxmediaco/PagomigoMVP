const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  phone_verified: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
    kyc_status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'pending'
  },
    balance: {
    type: Number,
    default: 500.00 // Starting demo balance
  },
  unitCustomerId: { type: String },
  unitAccountId: { type: String },
  unitOnboardingStatus: {
    type: String,
    enum: ['not_started', 'pending', 'completed', 'rejected'],
    default: 'not_started'
  }

}, { timestamps: true });