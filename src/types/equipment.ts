export const MAINTENANCE_TYPES = [
  { id: 'troca_cabos', label: 'Troca de Cabos', interval: 365, periodicidade: 'Anual' },
  { id: 'troca_redutor', label: 'Troca de Redutor', interval: 730, periodicidade: '2 Anos' },
  { id: 'troca_caixa_oca', label: 'Troca de Caixa Oca', interval: 1095, periodicidade: '3 Anos' },
  { id: 'troca_esticador', label: 'Troca de Esticador', interval: 365, periodicidade: 'Anual' },
  { id: 'troca_corrente', label: 'Troca de Corrente', interval: 365, periodicidade: 'Anual' },
  { id: 'troca_embreagem', label: 'Troca de Embreagem', interval: 730, periodicidade: '2 Anos' },
  { id: 'troca_lanca', label: 'Troca de Lança', interval: 1095, periodicidade: '3 Anos' },
  { id: 'troca_micro', label: 'Troca de Micro', interval: 180, periodicidade: 'Semestral' },
  { id: 'limpeza_caixa_selagem', label: 'Limpeza Caixa de Selagem', interval: 30, periodicidade: 'Mensal' },
] as const;

export type MaintenanceTypeId = typeof MAINTENANCE_TYPES[number]['id'];

export interface MaintenanceRecord {
  typeId: MaintenanceTypeId;
  label: string;
  periodicidade: string;
  ultimaManutencao: Date | null;
  proximaManutencao: Date | null;
  diasRestantes: number | null;
  status: 'ok' | 'warning' | 'critical' | 'overdue' | 'pending';
}

export interface Equipment {
  id: string;
  tag: string;
  elevacao: number;
  altura: number;
  descricao: string;
  area: string;
  tipo: string;
  manutencoes: MaintenanceRecord[];
  statusGeral: 'ok' | 'warning' | 'critical' | 'overdue';
  proximaManutencaoGeral: Date | null;
  diasRestantesGeral: number | null;
}

export interface MaintenanceStats {
  total: number;
  emDia: number;
  atencao: number;
  critico: number;
  atrasado: number;
}

export type StatusFilter = 'all' | 'ok' | 'warning' | 'critical' | 'overdue';

// Mapeamento completo de elevações e alturas para cada soprador (fallback para dados de amostra)
export const ELEVATION_DATA: Record<number, { elev: number; altura: number; area: string; tipo: string }> = {
  // Caldeira SPD 101-130
  101: { elev: 16, altura: 1.0, area: 'Caldeira', tipo: 'Rotativo' },
  102: { elev: 16, altura: 1.0, area: 'Caldeira', tipo: 'Rotativo' },
  103: { elev: 16, altura: 1.0, area: 'Caldeira', tipo: 'Rotativo' },
  104: { elev: 16, altura: 1.0, area: 'Caldeira', tipo: 'Rotativo' },
  105: { elev: 15, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  106: { elev: 15, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  107: { elev: 14, altura: 3.5, area: 'Caldeira', tipo: 'Rotativo' },
  108: { elev: 14, altura: 3.5, area: 'Caldeira', tipo: 'Rotativo' },
  109: { elev: 14, altura: 0.4, area: 'Caldeira', tipo: 'Rotativo' },
  110: { elev: 14, altura: 0.4, area: 'Caldeira', tipo: 'Rotativo' },
  111: { elev: 13, altura: 1.1, area: 'Caldeira', tipo: 'Rotativo' },
  112: { elev: 13, altura: 1.1, area: 'Caldeira', tipo: 'Rotativo' },
  113: { elev: 16, altura: 1.2, area: 'Caldeira', tipo: 'Rotativo' },
  114: { elev: 16, altura: 1.2, area: 'Caldeira', tipo: 'Rotativo' },
  115: { elev: 15, altura: 2.1, area: 'Caldeira', tipo: 'Rotativo' },
  116: { elev: 15, altura: 2.1, area: 'Caldeira', tipo: 'Rotativo' },
  117: { elev: 14, altura: 3.7, area: 'Caldeira', tipo: 'Rotativo' },
  118: { elev: 14, altura: 3.7, area: 'Caldeira', tipo: 'Rotativo' },
  119: { elev: 14, altura: 0.7, area: 'Caldeira', tipo: 'Rotativo' },
  120: { elev: 14, altura: 0.7, area: 'Caldeira', tipo: 'Rotativo' },
  121: { elev: 13, altura: 1.3, area: 'Caldeira', tipo: 'Rotativo' },
  122: { elev: 13, altura: 1.3, area: 'Caldeira', tipo: 'Rotativo' },
  123: { elev: 12, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  124: { elev: 12, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  125: { elev: 16, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  126: { elev: 16, altura: 1.9, area: 'Caldeira', tipo: 'Rotativo' },
  127: { elev: 15, altura: 2.7, area: 'Caldeira', tipo: 'Rotativo' },
  128: { elev: 15, altura: 2.7, area: 'Caldeira', tipo: 'Rotativo' },
  129: { elev: 15, altura: 0.7, area: 'Caldeira', tipo: 'Rotativo' },
  130: { elev: 15, altura: 0.7, area: 'Caldeira', tipo: 'Rotativo' },
  // Superaquecedor SPD 131-160
  131: { elev: 14, altura: 2.3, area: 'Superaquecedor', tipo: 'Retrátil' },
  132: { elev: 14, altura: 2.3, area: 'Superaquecedor', tipo: 'Retrátil' },
  133: { elev: 14, altura: 0.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  134: { elev: 14, altura: 0.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  135: { elev: 13, altura: 1.1, area: 'Superaquecedor', tipo: 'Retrátil' },
  136: { elev: 13, altura: 1.1, area: 'Superaquecedor', tipo: 'Retrátil' },
  137: { elev: 12, altura: 1.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  138: { elev: 12, altura: 1.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  139: { elev: 16, altura: 1.9, area: 'Superaquecedor', tipo: 'Retrátil' },
  140: { elev: 16, altura: 1.9, area: 'Superaquecedor', tipo: 'Retrátil' },
  141: { elev: 15, altura: 2.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  142: { elev: 15, altura: 2.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  143: { elev: 15, altura: 0.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  144: { elev: 15, altura: 0.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  145: { elev: 14, altura: 2.3, area: 'Superaquecedor', tipo: 'Retrátil' },
  146: { elev: 14, altura: 2.3, area: 'Superaquecedor', tipo: 'Retrátil' },
  147: { elev: 14, altura: 0.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  148: { elev: 14, altura: 0.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  149: { elev: 13, altura: 1.1, area: 'Superaquecedor', tipo: 'Retrátil' },
  150: { elev: 13, altura: 1.1, area: 'Superaquecedor', tipo: 'Retrátil' },
  151: { elev: 12, altura: 1.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  152: { elev: 12, altura: 1.7, area: 'Superaquecedor', tipo: 'Retrátil' },
  153: { elev: 16, altura: 2.8, area: 'Superaquecedor', tipo: 'Retrátil' },
  154: { elev: 16, altura: 2.8, area: 'Superaquecedor', tipo: 'Retrátil' },
  155: { elev: 16, altura: 1.0, area: 'Superaquecedor', tipo: 'Retrátil' },
  156: { elev: 16, altura: 1.0, area: 'Superaquecedor', tipo: 'Retrátil' },
  157: { elev: 15, altura: 1.9, area: 'Superaquecedor', tipo: 'Retrátil' },
  158: { elev: 15, altura: 1.9, area: 'Superaquecedor', tipo: 'Retrátil' },
  159: { elev: 14, altura: 3.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  160: { elev: 14, altura: 3.5, area: 'Superaquecedor', tipo: 'Retrátil' },
  // Economizador SPD 161-190
  161: { elev: 14, altura: 0.5, area: 'Economizador', tipo: 'Retrátil' },
  162: { elev: 14, altura: 0.5, area: 'Economizador', tipo: 'Retrátil' },
  163: { elev: 13, altura: 1.1, area: 'Economizador', tipo: 'Retrátil' },
  164: { elev: 13, altura: 1.1, area: 'Economizador', tipo: 'Retrátil' },
  165: { elev: 16, altura: 3.2, area: 'Economizador', tipo: 'Retrátil' },
  166: { elev: 16, altura: 3.2, area: 'Economizador', tipo: 'Retrátil' },
  167: { elev: 16, altura: 2.0, area: 'Economizador', tipo: 'Retrátil' },
  168: { elev: 16, altura: 2.0, area: 'Economizador', tipo: 'Retrátil' },
  169: { elev: 15, altura: 1.9, area: 'Economizador', tipo: 'Retrátil' },
  170: { elev: 15, altura: 1.9, area: 'Economizador', tipo: 'Retrátil' },
  171: { elev: 14, altura: 3.7, area: 'Economizador', tipo: 'Retrátil' },
  172: { elev: 14, altura: 3.7, area: 'Economizador', tipo: 'Retrátil' },
  173: { elev: 14, altura: 0.7, area: 'Economizador', tipo: 'Retrátil' },
  174: { elev: 14, altura: 0.7, area: 'Economizador', tipo: 'Retrátil' },
  175: { elev: 16, altura: 3.2, area: 'Economizador', tipo: 'Retrátil' },
  176: { elev: 16, altura: 3.2, area: 'Economizador', tipo: 'Retrátil' },
  177: { elev: 16, altura: 1.0, area: 'Economizador', tipo: 'Retrátil' },
  178: { elev: 16, altura: 1.0, area: 'Economizador', tipo: 'Retrátil' },
  179: { elev: 15, altura: 1.9, area: 'Economizador', tipo: 'Retrátil' },
  180: { elev: 15, altura: 1.9, area: 'Economizador', tipo: 'Retrátil' },
  181: { elev: 14, altura: 3.7, area: 'Economizador', tipo: 'Retrátil' },
  182: { elev: 14, altura: 3.7, area: 'Economizador', tipo: 'Retrátil' },
  183: { elev: 14, altura: 1.6, area: 'Economizador', tipo: 'Retrátil' },
  184: { elev: 14, altura: 1.6, area: 'Economizador', tipo: 'Retrátil' },
  185: { elev: 16, altura: 3.4, area: 'Economizador', tipo: 'Retrátil' },
  186: { elev: 16, altura: 3.4, area: 'Economizador', tipo: 'Retrátil' },
  187: { elev: 16, altura: 0.4, area: 'Economizador', tipo: 'Retrátil' },
  188: { elev: 16, altura: 0.4, area: 'Economizador', tipo: 'Retrátil' },
  189: { elev: 15, altura: 1.5, area: 'Economizador', tipo: 'Retrátil' },
  190: { elev: 15, altura: 1.5, area: 'Economizador', tipo: 'Retrátil' },
  // Ar Pré-Aquecido SPD 191-220
  191: { elev: 14, altura: 3.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  192: { elev: 14, altura: 3.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  193: { elev: 14, altura: 2.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  194: { elev: 14, altura: 2.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  195: { elev: 14, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  196: { elev: 14, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  197: { elev: 16, altura: 1.25, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  198: { elev: 13, altura: 0.6, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  199: { elev: 16, altura: 1.25, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  200: { elev: 16, altura: 1.25, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  201: { elev: 15, altura: 2.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  202: { elev: 15, altura: 2.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  203: { elev: 14, altura: 3.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  204: { elev: 14, altura: 3.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  205: { elev: 14, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  206: { elev: 14, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  207: { elev: 13, altura: 1.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  208: { elev: 13, altura: 1.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  209: { elev: 12, altura: 2.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  210: { elev: 12, altura: 2.4, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  211: { elev: 12, altura: 0.5, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  212: { elev: 12, altura: 0.5, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  213: { elev: 11, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  214: { elev: 11, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  215: { elev: 10, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  216: { elev: 10, altura: 0.7, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  217: { elev: 9, altura: 0.82, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  218: { elev: 9, altura: 0.82, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  219: { elev: 16, altura: 3.6, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  220: { elev: 16, altura: 3.6, area: 'Ar Pré-Aquecido', tipo: 'Rotativo' },
  // Reaquecedor SPD 221-250
  221: { elev: 16, altura: 1.25, area: 'Reaquecedor', tipo: 'Retrátil' },
  222: { elev: 16, altura: 1.25, area: 'Reaquecedor', tipo: 'Retrátil' },
  223: { elev: 15, altura: 2.7, area: 'Reaquecedor', tipo: 'Retrátil' },
  224: { elev: 15, altura: 2.7, area: 'Reaquecedor', tipo: 'Retrátil' },
  225: { elev: 16, altura: 0.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  226: { elev: 16, altura: 0.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  227: { elev: 14, altura: 2.2, area: 'Reaquecedor', tipo: 'Retrátil' },
  228: { elev: 14, altura: 2.2, area: 'Reaquecedor', tipo: 'Retrátil' },
  229: { elev: 13, altura: 2.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  230: { elev: 13, altura: 2.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  231: { elev: 13, altura: 0.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  232: { elev: 13, altura: 0.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  233: { elev: 12, altura: 1.4, area: 'Reaquecedor', tipo: 'Retrátil' },
  234: { elev: 12, altura: 1.4, area: 'Reaquecedor', tipo: 'Retrátil' },
  235: { elev: 11, altura: 1.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  236: { elev: 11, altura: 1.6, area: 'Reaquecedor', tipo: 'Retrátil' },
  237: { elev: 10, altura: 1.5, area: 'Reaquecedor', tipo: 'Retrátil' },
  238: { elev: 10, altura: 1.5, area: 'Reaquecedor', tipo: 'Retrátil' },
  239: { elev: 10, altura: 0.1, area: 'Reaquecedor', tipo: 'Retrátil' },
  240: { elev: 10, altura: 0.1, area: 'Reaquecedor', tipo: 'Retrátil' },
  241: { elev: 9, altura: 0.82, area: 'Reaquecedor', tipo: 'Retrátil' },
  242: { elev: 9, altura: 0.82, area: 'Reaquecedor', tipo: 'Retrátil' },
  243: { elev: 16, altura: 3.15, area: 'Reaquecedor', tipo: 'Retrátil' },
  244: { elev: 16, altura: 3.15, area: 'Reaquecedor', tipo: 'Retrátil' },
  245: { elev: 16, altura: 1.0, area: 'Reaquecedor', tipo: 'Retrátil' },
  246: { elev: 16, altura: 1.0, area: 'Reaquecedor', tipo: 'Retrátil' },
  247: { elev: 15, altura: 2.7, area: 'Reaquecedor', tipo: 'Retrátil' },
  248: { elev: 15, altura: 2.7, area: 'Reaquecedor', tipo: 'Retrátil' },
  249: { elev: 16, altura: 3.25, area: 'Reaquecedor', tipo: 'Retrátil' },
  250: { elev: 16, altura: 3.25, area: 'Reaquecedor', tipo: 'Retrátil' },
  // Tubulão SPD 251-274
  251: { elev: 15, altura: 1.5, area: 'Tubulão', tipo: 'Rotativo' },
  252: { elev: 15, altura: 1.5, area: 'Tubulão', tipo: 'Rotativo' },
  253: { elev: 14, altura: 1.4, area: 'Tubulão', tipo: 'Rotativo' },
  254: { elev: 14, altura: 1.4, area: 'Tubulão', tipo: 'Rotativo' },
  255: { elev: 12, altura: 2.6, area: 'Tubulão', tipo: 'Rotativo' },
  256: { elev: 16, altura: 2.6, area: 'Tubulão', tipo: 'Rotativo' },
  257: { elev: 11, altura: 1.3, area: 'Tubulão', tipo: 'Rotativo' },
  258: { elev: 11, altura: 1.3, area: 'Tubulão', tipo: 'Rotativo' },
  259: { elev: 9, altura: 0.87, area: 'Tubulão', tipo: 'Rotativo' },
  260: { elev: 9, altura: 0.87, area: 'Tubulão', tipo: 'Rotativo' },
  261: { elev: 16, altura: 3.4, area: 'Tubulão', tipo: 'Rotativo' },
  262: { elev: 16, altura: 3.4, area: 'Tubulão', tipo: 'Rotativo' },
  263: { elev: 16, altura: 3.25, area: 'Tubulão', tipo: 'Rotativo' },
  264: { elev: 16, altura: 3.25, area: 'Tubulão', tipo: 'Rotativo' },
  265: { elev: 15, altura: 1.5, area: 'Tubulão', tipo: 'Rotativo' },
  266: { elev: 15, altura: 1.5, area: 'Tubulão', tipo: 'Rotativo' },
  267: { elev: 14, altura: 1.4, area: 'Tubulão', tipo: 'Rotativo' },
  268: { elev: 14, altura: 1.4, area: 'Tubulão', tipo: 'Rotativo' },
  269: { elev: 12, altura: 2.6, area: 'Tubulão', tipo: 'Rotativo' },
  270: { elev: 12, altura: 2.6, area: 'Tubulão', tipo: 'Rotativo' },
  271: { elev: 9, altura: 0.87, area: 'Tubulão', tipo: 'Rotativo' },
  272: { elev: 9, altura: 0.87, area: 'Tubulão', tipo: 'Rotativo' },
  273: { elev: 14, altura: 2.4, area: 'Tubulão', tipo: 'Rotativo' },
  274: { elev: 14, altura: 2.4, area: 'Tubulão', tipo: 'Rotativo' },
  // Outros SPD 313-315
  313: { elev: 10, altura: 0.1, area: 'Outros', tipo: 'Rotativo' },
  314: { elev: 10, altura: 0.1, area: 'Outros', tipo: 'Rotativo' },
  315: { elev: 9, altura: 0.82, area: 'Outros', tipo: 'Rotativo' },
};