
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  roleId: 'roleId',
  isActive: 'isActive'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isSystem: 'isSystem',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isAdmin: 'isAdmin'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DashboardCardScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  component: 'component',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  stock: 'stock',
  category: 'category',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  nama: 'nama',
  telp: 'telp'
};

exports.Prisma.InventoryScalarFieldEnum = {
  id: 'id',
  nama_bahan: 'nama_bahan',
  lebar_bahan: 'lebar_bahan',
  berat_bahan: 'berat_bahan',
  est_pjg_bahan: 'est_pjg_bahan',
  tanggal: 'tanggal',
  foto: 'foto',
  roll: 'roll',
  keterangan: 'keterangan',
  asal_bahan: 'asal_bahan'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  isIncoming: 'isIncoming',
  timestamp: 'timestamp',
  status: 'status',
  messageType: 'messageType',
  mediaUrl: 'mediaUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  metadata: 'metadata',
  whatsappMessageId: 'whatsappMessageId',
  customerId: 'customerId'
};

exports.Prisma.WhatsAppTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  language: 'language',
  components: 'components',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WhatsAppConfigScalarFieldEnum = {
  id: 'id',
  apiKey: 'apiKey',
  phoneNumberId: 'phoneNumberId',
  businessAccountId: 'businessAccountId',
  accessToken: 'accessToken',
  webhookVerifyToken: 'webhookVerifyToken',
  status: 'status',
  lastChecked: 'lastChecked',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialTransactionScalarFieldEnum = {
  id: 'id',
  type: 'type',
  amount: 'amount',
  description: 'description',
  category: 'category',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  tanggal: 'tanggal',
  spk: 'spk',
  reject: 'reject',
  panjang_reject: 'panjang_reject',
  panjang_order: 'panjang_order',
  lebar_kertas: 'lebar_kertas',
  marketing: 'marketing',
  nominal: 'nominal',
  harga_satuan: 'harga_satuan',
  keterangan: 'keterangan',
  invoice: 'invoice',
  jenis_pembayaran: 'jenis_pembayaran',
  dp: 'dp',
  tgl_dp: 'tgl_dp',
  sisa: 'sisa',
  pelunasan: 'pelunasan',
  biaya_tambahan: 'biaya_tambahan',
  tgl_lunas: 'tgl_lunas',
  tgl_invoice: 'tgl_invoice',
  status: 'status',
  statusm: 'statusm',
  approval: 'approval',
  approve_mng: 'approve_mng',
  approval_barang: 'approval_barang',
  approval_opr: 'approval_opr',
  opr_id: 'opr_id',
  userId: 'userId',
  print_id: 'print_id',
  press_id: 'press_id',
  cutting_id: 'cutting_id',
  dtf_id: 'dtf_id',
  penyerahan_id: 'penyerahan_id',
  designer_id: 'designer_id',
  manager_id: 'manager_id',
  customerId: 'customerId',
  rip: 'rip',
  produk: 'produk',
  path: 'path',
  tf_dp: 'tf_dp',
  tf_pelunasan: 'tf_pelunasan',
  tf_full: 'tf_full',
  catatan_tf: 'catatan_tf',
  capture: 'capture',
  capture_name: 'capture_name',
  nama_kain: 'nama_kain',
  jumlah_kain: 'jumlah_kain',
  tipe_produk: 'tipe_produk',
  qty: 'qty',
  kategori: 'kategori',
  gramasi: 'gramasi',
  nama_produk: 'nama_produk',
  catatan: 'catatan',
  catatan_print: 'catatan_print',
  catatan_press: 'catatan_press',
  catatan_cutting: 'catatan_cutting',
  lebar_file: 'lebar_file',
  est_order: 'est_order',
  no_project: 'no_project',
  warna_acuan: 'warna_acuan',
  statusprod: 'statusprod',
  lebar_kain: 'lebar_kain',
  prioritas: 'prioritas',
  prints_mesin: 'prints_mesin',
  prints_icc: 'prints_icc',
  prints_target: 'prints_target',
  dimensi_file: 'dimensi_file',
  prints_qty: 'prints_qty',
  total_kertas: 'total_kertas',
  prints_bagus: 'prints_bagus',
  prints_reject: 'prints_reject',
  prints_waste: 'prints_waste',
  press_mesin: 'press_mesin',
  press_presure: 'press_presure',
  press_suhu: 'press_suhu',
  press_speed: 'press_speed',
  press_protect: 'press_protect',
  total_kain: 'total_kain',
  press_bagus: 'press_bagus',
  press_reject: 'press_reject',
  press_waste: 'press_waste',
  printd_mesin: 'printd_mesin',
  printd_icc: 'printd_icc',
  pet: 'pet',
  suhu_meja: 'suhu_meja',
  printd_speed: 'printd_speed',
  white_setting: 'white_setting',
  choke: 'choke',
  white_precentage: 'white_precentage',
  total_pet: 'total_pet',
  cutting_mesin: 'cutting_mesin',
  cutting_speed: 'cutting_speed',
  acc: 'acc',
  power: 'power',
  cutting_bagus: 'cutting_bagus',
  cutting_reject: 'cutting_reject',
  tgl_pengiriman: 'tgl_pengiriman',
  tambah_bahan: 'tambah_bahan',
  tambah_cutting: 'tambah_cutting',
  tambah_cutting1: 'tambah_cutting1',
  tambah_cutting2: 'tambah_cutting2',
  tambah_cutting3: 'tambah_cutting3',
  tambah_cutting4: 'tambah_cutting4',
  tambah_cutting5: 'tambah_cutting5',
  satuan_bahan: 'satuan_bahan',
  satuan_cutting: 'satuan_cutting',
  satuan_cutting1: 'satuan_cutting1',
  satuan_cutting2: 'satuan_cutting2',
  satuan_cutting3: 'satuan_cutting3',
  satuan_cutting4: 'satuan_cutting4',
  satuan_cutting5: 'satuan_cutting5',
  qty_bahan: 'qty_bahan',
  qty_cutting: 'qty_cutting',
  qty_cutting1: 'qty_cutting1',
  qty_cutting2: 'qty_cutting2',
  qty_cutting3: 'qty_cutting3',
  qty_cutting4: 'qty_cutting4',
  qty_cutting5: 'qty_cutting5',
  total_bahan: 'total_bahan',
  total_cutting: 'total_cutting',
  total_cutting1: 'total_cutting1',
  total_cutting2: 'total_cutting2',
  total_cutting3: 'total_cutting3',
  total_cutting4: 'total_cutting4',
  total_cutting5: 'total_cutting5',
  nominal_total: 'nominal_total',
  no: 'no',
  nospk: 'nospk',
  catatan_design: 'catatan_design',
  tgl_app_cs: 'tgl_app_cs',
  tgl_app_prod: 'tgl_app_prod',
  tgl_app_manager: 'tgl_app_manager',
  diskon: 'diskon',
  tambah_produk: 'tambah_produk',
  created_at: 'created_at',
  updated_at: 'updated_at',
  asal_bahan_id: 'asal_bahan_id',
  jns_produk_id: 'jns_produk_id',
  tgl_print: 'tgl_print',
  tgl_cutting: 'tgl_cutting',
  tgl_dtf: 'tgl_dtf',
  tgl_press: 'tgl_press',
  waktu_rip: 'waktu_rip',
  cutting_done: 'cutting_done',
  dtf_done: 'dtf_done',
  press_done: 'press_done',
  print_done: 'print_done'
};

exports.Prisma.ProdukScalarFieldEnum = {
  id: 'id',
  nama_produk: 'nama_produk',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PaperStockScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  manufacturer: 'manufacturer',
  width: 'width',
  height: 'height',
  length: 'length',
  gsm: 'gsm',
  thickness: 'thickness',
  remainingLength: 'remainingLength',
  addedByUserId: 'addedByUserId',
  updatedByUserId: 'updatedByUserId',
  takenByUserId: 'takenByUserId',
  dateAdded: 'dateAdded',
  dateUpdated: 'dateUpdated',
  dateTaken: 'dateTaken',
  approved: 'approved',
  notes: 'notes',
  qrCode: 'qrCode',
  paperRequestId: 'paperRequestId',
  availability: 'availability'
};

exports.Prisma.PaperRequestScalarFieldEnum = {
  id: 'id',
  requested_by: 'requested_by',
  gsm: 'gsm',
  width: 'width',
  length: 'length',
  user_notes: 'user_notes',
  status: 'status',
  approved_by: 'approved_by',
  rejected_by: 'rejected_by',
  created_at: 'created_at',
  updated_at: 'updated_at',
  paper_stock_id: 'paper_stock_id',
  paper_type: 'paper_type'
};

exports.Prisma.PaperLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  performed_by: 'performed_by',
  notes: 'notes',
  created_at: 'created_at',
  paper_stock_id: 'paper_stock_id',
  request_id: 'request_id'
};

exports.Prisma.InkStockScalarFieldEnum = {
  id: 'id',
  barcode_id: 'barcode_id',
  name: 'name',
  color: 'color',
  type: 'type',
  quantity: 'quantity',
  unit: 'unit',
  supplier: 'supplier',
  added_by: 'added_by',
  updatedByUserId: 'updatedByUserId',
  takenByUserId: 'takenByUserId',
  dateAdded: 'dateAdded',
  dateUpdated: 'dateUpdated',
  dateTaken: 'dateTaken',
  notes: 'notes',
  approved: 'approved',
  availability: 'availability',
  inkRequestId: 'inkRequestId'
};

exports.Prisma.InkRequestScalarFieldEnum = {
  id: 'id',
  requested_by: 'requested_by',
  ink_type: 'ink_type',
  color: 'color',
  quantity: 'quantity',
  unit: 'unit',
  user_notes: 'user_notes',
  status: 'status',
  approved_by: 'approved_by',
  rejected_by: 'rejected_by',
  ink_stock_id: 'ink_stock_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.InkLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  performed_by: 'performed_by',
  notes: 'notes',
  ink_stock_id: 'ink_stock_id',
  request_id: 'request_id',
  created_at: 'created_at'
};

exports.Prisma.OtherConsumableScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  quantity: 'quantity',
  unit: 'unit',
  supplier: 'supplier',
  added_by: 'added_by',
  notes: 'notes',
  availability: 'availability',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AssetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  serial_number: 'serial_number',
  purchase_date: 'purchase_date',
  supplier: 'supplier',
  value: 'value',
  status: 'status',
  location: 'location',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.OthersItemScalarFieldEnum = {
  id: 'id',
  qr_code: 'qr_code',
  category: 'category',
  item_name: 'item_name',
  description: 'description',
  quantity: 'quantity',
  unit: 'unit',
  location: 'location',
  notes: 'notes',
  availability: 'availability',
  user_id: 'user_id',
  taken_by_user_id: 'taken_by_user_id',
  taken_at: 'taken_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.OthersRequestScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  category: 'category',
  item_name: 'item_name',
  quantity: 'quantity',
  unit: 'unit',
  user_notes: 'user_notes',
  status: 'status',
  approver_id: 'approver_id',
  rejector_id: 'rejector_id',
  approved_at: 'approved_at',
  rejected_at: 'rejected_at',
  approver_notes: 'approver_notes',
  rejection_reason: 'rejection_reason',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.OthersLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  user_id: 'user_id',
  others_request_id: 'others_request_id',
  others_item_id: 'others_item_id',
  notes: 'notes',
  created_at: 'created_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.InventoryAvailability = exports.$Enums.InventoryAvailability = {
  YES: 'YES',
  NO: 'NO'
};

exports.Prisma.ModelName = {
  User: 'User',
  Role: 'Role',
  Permission: 'Permission',
  DashboardCard: 'DashboardCard',
  Product: 'Product',
  customer: 'customer',
  inventory: 'inventory',
  ChatMessage: 'ChatMessage',
  WhatsAppTemplate: 'WhatsAppTemplate',
  WhatsAppConfig: 'WhatsAppConfig',
  FinancialTransaction: 'FinancialTransaction',
  Order: 'Order',
  Produk: 'Produk',
  PaperStock: 'PaperStock',
  PaperRequest: 'PaperRequest',
  PaperLog: 'PaperLog',
  InkStock: 'InkStock',
  InkRequest: 'InkRequest',
  InkLog: 'InkLog',
  OtherConsumable: 'OtherConsumable',
  Asset: 'Asset',
  OthersItem: 'OthersItem',
  OthersRequest: 'OthersRequest',
  OthersLog: 'OthersLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
