const { PRESETS, ORDER } = require('./providers');

// Single source of truth for every editable section. The admin UI is generated from this.
const collections = {
  slides: {
    label: 'Banner Slides', singular: 'Slide', icon: '🖼️', columns: ['image', 'title', 'kind'],
    help: 'The sliding banner at the top of the home page: your products and your work. Drag order with the arrows. Switch the banner off in Settings → Hero.',
    fields: [
      { name: 'kind', label: 'Slide type', type: 'select', required: true, options: {
        product: 'Product / work picture (transparent background)', photo: 'Full-width photo background', machine: 'Animated label-printing machine' } },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'kicker', label: 'Small heading above the title', type: 'text', help: 'e.g. brand names or "Our work".' },
      { name: 'subtitle', label: 'Description', type: 'textarea' },
      { name: 'image', label: 'Picture', type: 'image', cutout: true, requiredIf: { field: 'kind', in: ['product', 'photo'] }, showIf: { field: 'kind', in: ['product', 'photo'] },
        help: 'Product slides look best with a transparent PNG/WebP. Upload a normal photo with a white background and press "Remove white background".' },
      { name: 'accent', label: 'Accent colour', type: 'text', default: '#c52d2f', help: 'Hex colour such as #3b82f6 – tints the glow, progress bar and highlights.' },
      { name: 'ctaLabel', label: 'Button text', type: 'text' },
      { name: 'ctaLink', label: 'Button link', type: 'url', help: 'e.g. /products/barcode-scanners' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  categories: {
    label: 'Categories', singular: 'Category', icon: '🗂️', slugId: 'name', columns: ['image', 'name', 'description'],
    fields: [
      { name: 'name', label: 'Category name', type: 'text', required: true },
      { name: 'description', label: 'Short description', type: 'textarea' },
      { name: 'image', label: 'Cover image', type: 'image', help: 'Optional. Defaults to the first product image.' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  products: {
    label: 'Products', singular: 'Product', icon: '📦', group: 'category', columns: ['image', 'name', 'category', 'featured'],
    fields: [
      { name: 'category', label: 'Category', type: 'select', optionsFrom: 'categories', required: true },
      { name: 'name', label: 'Product name', type: 'text', required: true },
      { name: 'image', label: 'Image', type: 'image', required: true },
      { name: 'description', label: 'Short description', type: 'textarea' },
      { name: 'specs', label: 'Specifications', type: 'lines', help: 'One specification per line.' },
      { name: 'featured', label: 'Feature on home page', type: 'checkbox', default: false },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  events: {
    label: 'Events & Assets', singular: 'Entry', icon: '🎪', group: 'type', columns: ['image', 'title', 'type', 'date'],
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: { event: 'Event attended', asset: 'Acquired asset' }, required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'image', label: 'Photo', type: 'image' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  software: {
    label: 'Software Showcase', singular: 'Software project', icon: '💻', columns: ['image', 'name', 'url'],
    fields: [
      { name: 'name', label: 'Client / project name', type: 'text', required: true },
      { name: 'url', label: 'Client website', type: 'url' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  updates: {
    label: 'Software & Support Updates', singular: 'Update', icon: '🔔', group: 'kind', columns: ['title', 'kind', 'version', 'date'],
    fields: [
      { name: 'kind', label: 'Appears on', type: 'select', options: { software: 'Software page', support: 'Support page' }, required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'version', label: 'Version', type: 'text' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'body', label: 'Details', type: 'textarea' },
      { name: 'file', label: 'Download file', type: 'file', help: 'Optional: driver, installer, PDF, ZIP…' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  support: {
    label: 'Support Cards', singular: 'Support card', icon: '🛟', columns: ['icon', 'title', 'description'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text', required: true },
      { name: 'icon', label: 'Icon (emoji)', type: 'text', default: '🛠️' },
      { name: 'link', label: 'Link', type: 'url', help: 'e.g. /products/barcode-printers (optional)' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  faqs: {
    label: 'FAQs', singular: 'FAQ', icon: '❓', columns: ['question'],
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
    help: 'Shown on the Support page and also used by the AI assistant.',
  },
  sectors: {
    label: 'Industries', singular: 'Industry', icon: '🏭', columns: ['image', 'title', 'text'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'text', label: 'Text', type: 'textarea', required: true },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  partners: {
    label: 'Clients & Certificates', singular: 'Logo', icon: '🏅', group: 'kind', columns: ['image', 'name', 'kind'],
    fields: [
      { name: 'kind', label: 'Type', type: 'select', options: { client: 'Client logo', certificate: 'Certificate / accreditation' }, required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'image', label: 'Logo', type: 'image', required: true },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  offices: {
    label: 'Offices', singular: 'Office', icon: '📍', columns: ['name', 'phone', 'email'],
    fields: [
      { name: 'name', label: 'Office name', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'lines', help: 'One line per row' },
      { name: 'phone', label: 'Telephone', type: 'text' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
    ],
  },
  leads: {
    label: 'Enquiries', singular: 'Enquiry', icon: '📥', group: 'status', noCreate: true, noOrder: true, noActive: true, newestFirst: true,
    columns: ['createdAt', 'name', 'phone', 'email', 'interest', 'source', 'status'],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: { new: 'New', contacted: 'Contacted', closed: 'Closed' }, required: true },
      { name: 'name', label: 'Name', type: 'text', readOnly: true },
      { name: 'phone', label: 'Phone', type: 'text', readOnly: true },
      { name: 'email', label: 'Email', type: 'text', readOnly: true },
      { name: 'interest', label: 'Interested in', type: 'text', readOnly: true },
      { name: 'message', label: 'Message', type: 'textarea', readOnly: true },
      { name: 'source', label: 'Source', type: 'text', readOnly: true },
      { name: 'createdAt', label: 'Received', type: 'text', readOnly: true },
      { name: 'notes', label: 'Internal notes', type: 'textarea' },
    ],
  },
};

const settingsGroups = [
  { title: 'Company', fields: [
    { name: 'companyName', label: 'Company name', type: 'text' },
    { name: 'tagline', label: 'Tagline', type: 'text' },
    { name: 'logo', label: 'Logo', type: 'image' },
  ] },
  { title: 'Home page hero', fields: [
    { name: 'heroKicker', label: 'Small heading', type: 'text' },
    { name: 'heroTitle', label: 'Main headline', type: 'text' },
    { name: 'heroSubtitle', label: 'Sub-heading', type: 'text' },
    { name: 'heroStyle', label: 'Hero picture', type: 'select', options: { slider: 'Sliding banner (edit in Banner Slides)', image: 'Static picture (the image below)' } },
    { name: 'heroImage', label: 'Hero image (used when "Static picture" is selected)', type: 'image' },
  ] },
  { title: 'Contact', fields: [
    { name: 'phones', label: 'Phone numbers (shown in header/footer)', type: 'text' },
    { name: 'email', label: 'Sales email', type: 'text' },
    { name: 'whatsappNumber', label: 'WhatsApp number', type: 'text', help: 'Digits with country code, no + or spaces. e.g. 919891060187' },
    { name: 'whatsappMessage', label: 'WhatsApp pre-filled message', type: 'text' },
  ] },
  { title: 'Label printing machine & service', fields: [
    { name: 'machineTitle', label: 'Machine name', type: 'text' },
    { name: 'machineCaption', label: 'Banner caption (under the machine)', type: 'text' },
    { name: 'machineSpecs', label: 'Specification', type: 'textarea', rows: 6, help: 'One point per line.' },
    { name: 'serviceTitle', label: 'Printing service heading', type: 'text' },
    { name: 'serviceText', label: 'Printing service text', type: 'textarea', rows: 4 },
  ] },
  { title: 'About & software text', fields: [
    { name: 'aboutTitle', label: 'Mission heading', type: 'text' },
    { name: 'mission', label: 'Mission statement', type: 'text' },
    { name: 'aboutText', label: 'About us text', type: 'textarea', rows: 12, help: 'Separate paragraphs with a blank line.' },
    { name: 'softwareIntro', label: 'Software page intro', type: 'textarea', rows: 5 },
    { name: 'eventsShown', label: 'Events shown on home page', type: 'text' },
  ] },
  { title: 'Footer & SEO', fields: [
    { name: 'footerText', label: 'Footer text', type: 'text' },
    { name: 'footerSince', label: 'Copyright start year', type: 'text' },
    { name: 'siteTitle', label: 'Site title (browser tab / Google)', type: 'text' },
    { name: 'siteDescription', label: 'Site description (Google)', type: 'textarea', rows: 3 },
  ] },
  { title: 'Chat assistant', fields: [
    { name: 'chatMode', label: 'Chat on website', type: 'select', options: { both: 'AI assistant + WhatsApp', ai: 'AI assistant only', whatsapp: 'WhatsApp button only', off: 'Off' } },
    { name: 'chatProvider', label: 'AI provider', type: 'select',
      options: { auto: 'Automatic (first provider that has an API key)', ...Object.fromEntries(ORDER.map(id => [id, PRESETS[id].label])) },
      help: 'API keys are set as environment variables on your host (e.g. OPENAI_API_KEY, DEEPSEEK_API_KEY) — never here.' },
    { name: 'chatModel', label: 'AI model (optional)', type: 'text', help: 'Leave empty for the provider default. Use a fast, non-reasoning model for chat. Check the provider\'s docs for current model names.' },
    { name: 'chatName', label: 'Assistant name', type: 'text' },
    { name: 'chatWelcome', label: 'Welcome message', type: 'textarea', rows: 2 },
    { name: 'chatKnowledge', label: 'Extra instructions & knowledge for the AI', type: 'textarea', rows: 7,
      help: 'Anything the assistant should know or follow: delivery areas, warranty, business hours, policies… (Products, FAQs, offices and software are added automatically.)' },
  ] },
];
const settingsFields = settingsGroups.flatMap(g => g.fields);
// never sent to the public site
const PRIVATE_SETTINGS = ['chatKnowledge'];

// Enquiries first in the admin menu: it's what the owner checks most
const ordered = { leads: collections.leads, slides: collections.slides, ...collections };

module.exports = { collections: ordered, settingsGroups, settingsFields, PRIVATE_SETTINGS };
