const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const mongoUri = fs
  .readFileSync(envPath, 'utf8')
  .match(/^MONGO_URI=(.+)$/m)?.[1]
  ?.trim();

if (!mongoUri) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

const COLLECTIONS = [
  'users',
  'userprofiles',
  'banks',
  'numberings',
  'vatrates',
  'paymentmethods',
  'financialparameters',
  'vatversions',
  'categories',
  'subcategories',
  'articles',
  'pricecategories',
  'customers',
  'countries',
  'cities',
  'suppliers',
  'tickets',
  'waitingtickets',
  'ticketcounters',
  'xreports',
  'templates',
  'scrappurchases',
  'productions',
];

const userSchema = new mongoose.Schema(
  {
    name: String,
    password: String,
    role: { type: String, default: 'user' },
    accesses: { type: Object, required: false },
  },
  { versionKey: false },
);

const numberingSchema = new mongoose.Schema(
  {
    articles: { type: Boolean, default: true },
    customers: { type: Boolean, default: true },
    suppliers: { type: Boolean, default: true },
    receipts: { type: Number, default: 0 },
    invoices: { type: Number, default: 0 },
    creditNotes: { type: Number, default: 0 },
    quotations: { type: Number, default: 0 },
    salesOrders: { type: Number, default: 0 },
    deliveryNotes: { type: Number, default: 0 },
    supplierOrders: { type: Number, default: 0 },
    repairOrders: { type: Number, default: 0 },
  },
  { versionKey: '__v' },
);

const vatRateSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  rate: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

const paymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
});

const financialParametersSchema = new mongoose.Schema({
  vatRates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VatRate' }],
  paymentMethods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod' }],
  allowSaleOnCredit: { type: Boolean, default: false },
  decimalPlaces: { type: Number, default: 2 },
    currencySymbol: { type: String, default: 'Rs' },
  enableFidelity: { type: Boolean, default: false },
  fidelityBonus: { type: Number, default: 0 },
  fidelityTotalPurchaseRequired: { type: Number, default: 0 },
  enableDailyGoal: { type: Boolean, default: false },
  dailyTurnoverGoal: { type: Number, default: 0 },
});

const vatVersionSchema = new mongoose.Schema(
  {
    versionLabel: { type: String, required: true },
    VAT1: { type: Number, required: true },
    VAT2: { type: Number, required: true },
    VAT3: { type: Number, required: true },
    VAT4: { type: Number, required: true },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const userProfileSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  zipCode: String,
  tel: String,
  fax: String,
  email: String,
  indicatonMandatory: String,
  banks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bank' }],
  optionalParameters: { type: Object, default: {} },
});

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    templateContent: String,
    selected: { type: Boolean, default: false },
  },
  { versionKey: false },
);

const DEFAULT_RECEIPT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; color: #111;">
  <h2 style="text-align: center; margin: 0 0 8px;">{{data.companyName}}</h2>
  <p style="text-align: center; margin: 0 0 12px; font-size: 11px;">
    {{data.companyStreetAddress}}<br/>
    {{data.companyCityAddress}}<br/>
    {{data.companyCountry}}<br/>
    Tel: {{data.companyTelphone}}
  </p>
  <hr style="border: none; border-top: 1px dashed #999; margin: 10px 0;" />
  <p style="margin: 4px 0;"><strong>Receipt No:</strong> {{data.factureNumber}}</p>
  <p style="margin: 4px 0;"><strong>Date:</strong> {{data.date}}</p>
  <p style="margin: 4px 0;"><strong>Customer:</strong> {{data.customerName}} ({{data.customerCode}})</p>
  <p style="margin: 4px 0; font-size: 11px;">{{data.customerStreetAddress}}, {{data.customerCityAddress}}</p>
  <div style="margin: 12px 0;">{{{confirmInvoiceTableDemo}}}</div>
  <p style="margin: 4px 0; text-align: right;"><strong>Subtotal:</strong> Rs {{data.totalHT}}</p>
  <p style="margin: 4px 0; text-align: right;"><strong>GST:</strong> Rs {{data.TVA}}</p>
  <p style="margin: 8px 0; text-align: right; font-size: 14px;"><strong>Total:</strong> Rs {{data.totalTTC}}</p>
  <div style="margin: 12px 0;">{{{confirmPaymentMethodsDemo}}}</div>
  <p style="text-align: center; margin-top: 16px; font-size: 11px;">Thank you for your business!</p>
</div>`;

const countrySchema = new mongoose.Schema(
  {
    countryName: { type: String, required: true, unique: true },
    countryCode: String,
  },
  { versionKey: false },
);

const citySchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true, unique: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  },
  { versionKey: false },
);

async function ensureCollections(db) {
  const existing = new Set(
    (await db.listCollections().toArray()).map((collection) => collection.name),
  );

  for (const collectionName of COLLECTIONS) {
    if (!existing.has(collectionName)) {
      await db.createCollection(collectionName);
      console.log(`Created collection: ${collectionName}`);
    }
  }
}

async function migrateLegacyUserCollection(db) {
  const legacyUsers = await db.collection('User').find().toArray();
  if (!legacyUsers.length) {
    return;
  }

  const User = mongoose.model('User', userSchema);
  for (const legacyUser of legacyUsers) {
    const exists = await User.findOne({ name: legacyUser.name });
    if (!exists) {
      await User.create({
        name: legacyUser.name,
        password: legacyUser.password,
        role: legacyUser.role,
        accesses: legacyUser.accesses,
      });
      console.log(`Migrated user "${legacyUser.name}" to users collection`);
    }
  }

  await db.collection('User').drop();
  console.log('Removed legacy User collection');
}

async function seedAdminUser() {
  const User = mongoose.model('User', userSchema);
  const existing = await User.findOne({ name: 'Ali' });

  if (existing) {
    console.log('Admin user "Ali" already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await User.create({
    name: 'Ali',
    password: hashedPassword,
    role: 'admin',
  });
  console.log('Created admin user: Ali');
}

async function seedNumbering() {
  const Numbering = mongoose.model('Numbering', numberingSchema);
  const existing = await Numbering.findOne();
  if (existing) {
    console.log('Numbering settings already exist');
    return;
  }

  await Numbering.create({});
  console.log('Created default numbering settings');
}

async function seedVatRates() {
  const VatRate = mongoose.model('VatRate', vatRateSchema);
  const defaults = [
    { code: 'VAT1', rate: 18, isActive: true },
    { code: 'VAT2', rate: 5, isActive: true },
    { code: 'VAT3', rate: 0, isActive: true },
    { code: 'VAT4', rate: 0, isActive: true },
  ];

  const created = [];
  for (const vat of defaults) {
    const existing = await VatRate.findOne({ code: vat.code });
    if (existing) {
      created.push(existing);
      continue;
    }
    created.push(await VatRate.create(vat));
    console.log(`Created VAT rate: ${vat.code}`);
  }

  return created;
}

async function seedPaymentMethods() {
  const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
  const defaults = ['CASH', 'CARD', 'CREDIT'];
  const created = [];

  for (const name of defaults) {
    const existing = await PaymentMethod.findOne({ name });
    if (existing) {
      created.push(existing);
      continue;
    }
    created.push(await PaymentMethod.create({ name, isActive: true }));
    console.log(`Created payment method: ${name}`);
  }

  return created;
}

async function seedFinancialParameters(vatRates, paymentMethods) {
  const FinancialParameters = mongoose.model(
    'FinancialParameters',
    financialParametersSchema,
  );
  const existing = await FinancialParameters.findOne();
  if (existing) {
    if (existing.currencySymbol === '€') {
      existing.currencySymbol = 'Rs';
      await existing.save();
      console.log('Updated currency to Rs for Pakistan');
    } else {
      console.log('Financial parameters already exist');
    }
    return;
  }

  await FinancialParameters.create({
    vatRates: vatRates.map((vat) => vat._id),
    paymentMethods: paymentMethods.map((method) => method._id),
    allowSaleOnCredit: false,
    decimalPlaces: 2,
    currencySymbol: 'Rs',
    enableFidelity: false,
    fidelityBonus: 0,
    fidelityTotalPurchaseRequired: 0,
    enableDailyGoal: false,
    dailyTurnoverGoal: 0,
  });
  console.log('Created financial parameters');
}

async function seedVatVersion(vatRates) {
  const VatVersion = mongoose.model('VatVersion', vatVersionSchema);
  const existing = await VatVersion.findOne();
  if (existing) {
    console.log('VAT version already exists');
    return;
  }

  const byCode = Object.fromEntries(vatRates.map((vat) => [vat.code, vat.rate]));
  await VatVersion.create({
    versionLabel: 'Initial Version',
    VAT1: byCode.VAT1 ?? 18,
    VAT2: byCode.VAT2 ?? 5,
    VAT3: byCode.VAT3 ?? 0,
    VAT4: byCode.VAT4 ?? 0,
    effectiveFrom: new Date(),
  });
  console.log('Created initial VAT version');
}

async function seedUserProfile() {
  const UserProfile = mongoose.model('UserProfile', userProfileSchema);
  const existing = await UserProfile.findOne();
  if (existing) {
    console.log('User profile already exists');
    return;
  }

  await UserProfile.create({
    name: 'Lahore POS',
    address: '',
    city: 'Lahore',
    zipCode: '',
    tel: '',
    fax: '',
    email: '',
    indicatonMandatory: '',
    banks: [],
    optionalParameters: {},
  });
  console.log('Created default user profile');
}

async function seedDefaultReceiptTemplate() {
  const Template = mongoose.model('Template', templateSchema);
  const existing = await Template.findOne();
  if (existing) {
    const selected = await Template.findOne({ selected: true });
    if (!selected) {
      existing.selected = true;
      await existing.save();
      console.log('Marked existing receipt template as selected');
    } else {
      console.log('Receipt template already exists');
    }
    return;
  }

  await Template.create({
    name: 'Pakistan POS Receipt',
    templateContent: DEFAULT_RECEIPT_TEMPLATE,
    selected: true,
  });
  console.log('Created default Pakistan POS receipt template');
}

async function seedCountryAndCity() {
  const Country = mongoose.model('Country', countrySchema);
  const City = mongoose.model('City', citySchema);

  let country = await Country.findOne({ countryName: 'Pakistan' });
  if (!country) {
    country = await Country.create({
      countryName: 'Pakistan',
      countryCode: 'PK',
    });
    console.log('Created country: Pakistan');
  }

  const city = await City.findOne({ cityName: 'Lahore' });
  if (!city) {
    await City.create({
      cityName: 'Lahore',
      countryId: country._id,
    });
    console.log('Created city: Lahore');
  }
}

async function seedDatabase() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  console.log('Ensuring all collections exist...');
  await ensureCollections(db);

  console.log('Migrating legacy data if needed...');
  await migrateLegacyUserCollection(db);

  console.log('Seeding default records...');
  await seedAdminUser();
  await seedNumbering();
  const vatRates = await seedVatRates();
  const paymentMethods = await seedPaymentMethods();
  await seedFinancialParameters(vatRates, paymentMethods);
  await seedVatVersion(vatRates);
  await seedUserProfile();
  await seedDefaultReceiptTemplate();
  await seedCountryAndCity();

  const collections = (await db.listCollections().toArray())
    .map((collection) => collection.name)
    .sort();
  console.log('\nDatabase ready. Collections:');
  collections.forEach((name) => console.log(`  - ${name}`));

  await mongoose.disconnect();
}

seedDatabase().catch((error) => {
  console.error('Database seed failed:', error.message);
  process.exit(1);
});
