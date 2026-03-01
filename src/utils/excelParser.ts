import * as XLSX from 'xlsx';
import { Equipment, MaintenanceStats, MaintenanceRecord, MAINTENANCE_TYPES, MaintenanceTypeId, ELEVATION_DATA } from '@/types/equipment';

function calculateDaysRemaining(nextMaintenance: Date | null): number | null {
  if (!nextMaintenance) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextMaintenance);
  next.setHours(0, 0, 0, 0);
  const diffTime = next.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getStatus(daysRemaining: number | null): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (daysRemaining === null) return 'pending';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'ok';
}

function getOverallStatus(manutencoes: MaintenanceRecord[]): 'ok' | 'warning' | 'critical' | 'overdue' {
  const hasOverdue = manutencoes.some(maintenanceRecord => maintenanceRecord.status === 'overdue');
  if (hasOverdue) return 'overdue';
  const hasCritical = manutencoes.some(maintenanceRecord => maintenanceRecord.status === 'critical');
  if (hasCritical) return 'critical';
  const hasWarning = manutencoes.some(maintenanceRecord => maintenanceRecord.status === 'warning');
  if (hasWarning) return 'warning';
  return 'ok';
}

function parseDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'ATRASADA' || trimmed === 'A definir' || trimmed === 'N/A') return null;

  // dd/mm/yyyy format
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try ISO format
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

function excelDateToJSDate(excelDate: number | string | Date | null | undefined): Date | null {
  if (!excelDate) return null;
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'string') return parseDateString(excelDate);
  if (typeof excelDate === 'number') {
    const utc_days = Math.floor(excelDate - 25569);
    return new Date(utc_days * 86400 * 1000);
  }
  return null;
}

// Mapping maintenance type names from Excel to our type IDs
const maintenanceNameToId: Record<string, MaintenanceTypeId> = {
  'Troca de Cabos': 'troca_cabos',
  'Troca de Redutor': 'troca_redutor',
  'Troca de Caixa Oca': 'troca_caixa_oca',
  'Troca de Esticador': 'troca_esticador',
  'Troca de Corrente': 'troca_corrente',
  'Troca de Embreagem': 'troca_embreagem',
  'Troca de Lança': 'troca_lanca',
  'Troca da Lança': 'troca_lanca',
  'Troca de Micro': 'troca_micro',
  'Limpeza Caixa de Selagem': 'limpeza_caixa_selagem',
  'Limpeza e Caixa de Selagem': 'limpeza_caixa_selagem',
};

interface MaintenanceRow {
  tag: string;
  area: string;
  tipoManutencao: string;
  periodicidade: string;
  status: string;
  diasRestantes: number | null;
  ultimaExecucao: Date | null;
  proximaPrevista: Date | null;
}

function parseMaintenanceSheet(worksheet: XLSX.WorkSheet): MaintenanceRow[] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  const rows: MaintenanceRow[] = [];

  for (const row of jsonData as any[]) {
    const tag = row['TAG Soprador'] || row['TAG'] || '';
    const tipoManutencao = row['Tipo Manutenção'] || row['Tipo Manutencao'] || '';
    const diasStr = row['Dias Restantes'];
    const diasRestantes = diasStr && diasStr !== 'N/A' ? parseInt(diasStr) : null;
    const proximaStr = row['Próxima Prevista'] || row['Proxima Prevista'] || '';
    const ultimaStr = row['Última Execução'] || row['Ultima Execucao'] || '';

    let proximaPrevista: Date | null = null;
    if (proximaStr && proximaStr !== 'ATRASADA' && proximaStr !== 'A definir') {
      proximaPrevista = parseDateString(proximaStr);
    } else if (proximaStr === 'ATRASADA' && diasRestantes !== null) {
      // Calculate the overdue date from today + negative days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      proximaPrevista = new Date(today);
      proximaPrevista.setDate(today.getDate() + diasRestantes);
    }

    let ultimaExecucao: Date | null = null;
    if (ultimaStr && ultimaStr !== 'Nunca') {
      ultimaExecucao = parseDateString(ultimaStr);
    }

    rows.push({
      tag,
      area: row['Área'] || row['Area'] || '',
      tipoManutencao,
      periodicidade: row['Periodicidade'] || '',
      status: row['Status'] || '',
      diasRestantes,
      ultimaExecucao,
      proximaPrevista,
    });
  }

  return rows;
}

interface EquipmentBaseRow {
  tag: string;
  area: string;
  elevacao: number;
  altura: number;
  tipo: string;
}

function parseEquipmentSheet(worksheet: XLSX.WorkSheet): EquipmentBaseRow[] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  const rows: EquipmentBaseRow[] = [];

  for (const row of jsonData as any[]) {
    const tag = row['TAG'] || row['Tag'] || '';
    rows.push({
      tag,
      area: row['Área'] || row['Area'] || 'Caldeira',
      elevacao: parseFloat(row['Elevação'] || row['Elevacao'] || '0') || 0,
      altura: parseFloat(row['Altura (m)'] || row['Altura'] || '0') || 0,
      tipo: row['Tipo'] || 'Rotativo',
    });
  }

  return rows;
}

export async function parseExcelFile(file: File | ArrayBuffer): Promise<Equipment[]> {
  let workbook: XLSX.WorkBook;

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  } else {
    workbook = XLSX.read(file, { type: 'array', cellDates: false });
  }

  const sheetNames = workbook.SheetNames;
  console.log('Sheet names:', sheetNames);

  // Check if this is our multi-sheet format (Sopradores + Manutenções)
  const hasMaintenanceSheet = sheetNames.length >= 3;

  if (hasMaintenanceSheet) {
    return parseMultiSheetWorkbook(workbook);
  }

  // Fallback: single-sheet format (legacy)
  return parseSingleSheetWorkbook(workbook);
}

function parseMultiSheetWorkbook(workbook: XLSX.WorkBook): Equipment[] {
  const sheetNames = workbook.SheetNames;

  // Sheet 1: Equipment base data (Sopradores)
  const equipSheet = workbook.Sheets[sheetNames[0]];
  const equipRows = parseEquipmentSheet(equipSheet);

  // Sheet 3: Maintenance records (Manutenções)
  const maintSheet = workbook.Sheets[sheetNames[2]];
  const maintRows = parseMaintenanceSheet(maintSheet);

  // Group maintenance records by TAG
  const maintByTag = new Map<string, MaintenanceRow[]>();
  for (const row of maintRows) {
    const existing = maintByTag.get(row.tag) || [];
    existing.push(row);
    maintByTag.set(row.tag, existing);
  }

  const equipment: Equipment[] = equipRows.map((equipmentRow, index) => {
    const tagMaint = maintByTag.get(equipmentRow.tag) || [];

    // Build maintenance records from the maintenance sheet
    const manutencoes: MaintenanceRecord[] = MAINTENANCE_TYPES.map(type => {
      const matchingRow = tagMaint.find(maintenanceRow => {
        const typeId = maintenanceNameToId[maintenanceRow.tipoManutencao];
        return typeId === type.id;
      });

      if (matchingRow) {
        const diasRestantes = matchingRow.proximaPrevista
          ? calculateDaysRemaining(matchingRow.proximaPrevista)
          : matchingRow.diasRestantes;

        return {
          typeId: type.id,
          label: type.label,
          periodicidade: type.periodicidade,
          ultimaManutencao: matchingRow.ultimaExecucao,
          proximaManutencao: matchingRow.proximaPrevista,
          diasRestantes,
          status: getStatus(diasRestantes),
        };
      }

      // No matching maintenance record found
      return {
        typeId: type.id,
        label: type.label,
        periodicidade: type.periodicidade,
        ultimaManutencao: null,
        proximaManutencao: null,
        diasRestantes: null,
        status: 'pending' as const,
      };
    });

    const validManutencoes = manutencoes.filter(maintenanceRecord => maintenanceRecord.proximaManutencao !== null);
    const proximaManutencaoGeral = validManutencoes.length > 0
      ? validManutencoes.reduce((earliestDate, maintenanceRecord) =>
          !earliestDate || (maintenanceRecord.proximaManutencao && maintenanceRecord.proximaManutencao < earliestDate) ? maintenanceRecord.proximaManutencao : earliestDate,
          null as Date | null
        )
      : null;
    const diasRestantesGeral = validManutencoes.length > 0
      ? validManutencoes.reduce((minDays, maintenanceRecord) =>
          maintenanceRecord.diasRestantes !== null && (minDays === null || maintenanceRecord.diasRestantes < minDays) ? maintenanceRecord.diasRestantes : minDays,
          null as number | null
        )
      : null;

    return {
      id: `equip-${index + 1}`,
      tag: equipmentRow.tag,
      elevacao: equipmentRow.elevacao,
      altura: equipmentRow.altura,
      descricao: `Soprador de Fuligem ${equipmentRow.tipo}`,
      area: equipmentRow.area,
      tipo: equipmentRow.tipo,
      manutencoes,
      statusGeral: getOverallStatus(manutencoes),
      proximaManutencaoGeral,
      diasRestantesGeral,
    };
  });

  return equipment;
}

function parseSingleSheetWorkbook(workbook: XLSX.WorkBook): Equipment[] {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

  const equipment: Equipment[] = jsonData.map((row: any, index: number) => {
    const tag = row['TAG'] || row['Tag'] || row['tag'] || `SPD-${index + 101}`;
    const tagStr = typeof tag === 'number' ? `SPD-${tag}` : String(tag);
    const spdNumber = parseInt(tagStr.replace(/\D/g, '')) || (index + 101);
    const elevData = ELEVATION_DATA[spdNumber] || { elev: 0, altura: 0, area: 'Caldeira', tipo: 'Rotativo' };

    const manutencoes: MaintenanceRecord[] = MAINTENANCE_TYPES.map(type => ({
      typeId: type.id,
      label: type.label,
      periodicidade: type.periodicidade,
      ultimaManutencao: null,
      proximaManutencao: null,
      diasRestantes: null,
      status: 'pending' as const,
    }));

    return {
      id: `equip-${index + 1}`,
      tag: tagStr,
      elevacao: parseFloat(row['Elevação'] || row['Elevacao'] || '') || elevData.elev,
      altura: parseFloat(row['Altura (m)'] || row['Altura'] || '') || elevData.altura,
      descricao: row['Descrição'] || row['Descricao'] || `Soprador de Fuligem`,
      area: row['Área'] || row['Area'] || elevData.area,
      tipo: row['Tipo'] || elevData.tipo,
      manutencoes,
      statusGeral: getOverallStatus(manutencoes),
      proximaManutencaoGeral: null,
      diasRestantesGeral: null,
    };
  });

  return equipment;
}

export async function loadDefaultData(): Promise<Equipment[]> {
  try {
    const response = await fetch('/data/equipamentos.xlsx');
    if (!response.ok) throw new Error('File not found');
    const arrayBuffer = await response.arrayBuffer();
    return parseExcelFile(arrayBuffer);
  } catch (error) {
    console.log('Loading sample data...', error);
    return generateSampleData();
  }
}

function generateSampleData(): Equipment[] {
  const spdIds: number[] = [];
  for (let i = 101; i <= 274; i++) {
    spdIds.push(i);
  }
  spdIds.push(313, 314, 315);

  const equipment: Equipment[] = [];

  spdIds.forEach((spdId, index) => {
    const elevData = ELEVATION_DATA[spdId] || { elev: 0, altura: 0, area: 'Outros', tipo: 'Rotativo' };

    const manutencoes: MaintenanceRecord[] = MAINTENANCE_TYPES.map(type => {
      const hasMaintenance = Math.random() > 0.2; // 80% chance of having a date
      if (!hasMaintenance) {
        return {
          typeId: type.id,
          label: type.label,
          periodicidade: type.periodicidade,
          ultimaManutencao: null,
          proximaManutencao: null,
          diasRestantes: null,
          status: 'pending' as const,
        };
      }

      const baseDate = new Date();
      const randomOffset = Math.floor(Math.random() * 120) - 30; // -30 to +90 days
      const proximaManutencao = new Date(baseDate);
      proximaManutencao.setDate(baseDate.getDate() + randomOffset);

      const diasRestantes = calculateDaysRemaining(proximaManutencao);

      return {
        typeId: type.id,
        label: type.label,
        periodicidade: type.periodicidade,
        ultimaManutencao: null,
        proximaManutencao,
        diasRestantes,
        status: getStatus(diasRestantes),
      };
    });

    const statusGeral = getOverallStatus(manutencoes);
    const validManutencoes = manutencoes.filter(maintenanceRecord => maintenanceRecord.proximaManutencao !== null);
    const proximaManutencaoGeral = validManutencoes.reduce((earliestDate, maintenanceRecord) =>
      !earliestDate || (maintenanceRecord.proximaManutencao && maintenanceRecord.proximaManutencao < earliestDate) ? maintenanceRecord.proximaManutencao : earliestDate,
      null as Date | null
    );
    const diasRestantesGeral = validManutencoes.reduce((minDays, maintenanceRecord) =>
      maintenanceRecord.diasRestantes !== null && (minDays === null || maintenanceRecord.diasRestantes < minDays) ? maintenanceRecord.diasRestantes : minDays,
      null as number | null
    );

    equipment.push({
      id: `equip-${spdId}`,
      tag: `SPD-${spdId}`,
      elevacao: elevData.elev,
      altura: elevData.altura,
      descricao: `Soprador de Fuligem ${elevData.tipo}`,
      area: elevData.area,
      tipo: elevData.tipo,
      manutencoes,
      statusGeral,
      proximaManutencaoGeral,
      diasRestantesGeral,
    });
  });

  return equipment;
}

export function calculateStats(equipment: Equipment[]): MaintenanceStats {
  return {
    total: equipment.length,
    emDia: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'ok').length,
    atencao: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'warning').length,
    critico: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'critical').length,
    atrasado: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'overdue').length,
  };
}

export function exportToPowerBI(equipment: Equipment[]): void {
  const workbook = XLSX.utils.book_new();

  // ========== ABA 1: DADOS PRINCIPAIS ==========
  const mainData: any[] = equipment.map(equipmentItem => {
    const row: any = {
      TAG: equipmentItem.tag,
      Área: equipmentItem.area,
      Elevação: equipmentItem.elevacao,
      'Altura (m)': equipmentItem.altura,
      Tipo: equipmentItem.tipo,
      'Status Geral': equipmentItem.statusGeral === 'ok' ? 'Em Dia' :
                      equipmentItem.statusGeral === 'warning' ? 'Atenção' :
                      equipmentItem.statusGeral === 'critical' ? 'Crítico' : 'Atrasado',
      'Próxima Manutenção': equipmentItem.proximaManutencaoGeral?.toLocaleDateString('pt-BR') || '',
      'Dias Restantes': equipmentItem.diasRestantesGeral ?? '',
    };

    // Add each maintenance type as columns
    equipmentItem.manutencoes.forEach(maintenanceRecord => {
      row[maintenanceRecord.label] = maintenanceRecord.proximaManutencao?.toLocaleDateString('pt-BR') || '';
      row[`${maintenanceRecord.label} - Dias`] = maintenanceRecord.diasRestantes ?? '';
      row[`${maintenanceRecord.label} - Status`] = maintenanceRecord.status === 'ok' ? 'Em Dia' :
                                    maintenanceRecord.status === 'warning' ? 'Atenção' :
                                    maintenanceRecord.status === 'critical' ? 'Crítico' :
                                    maintenanceRecord.status === 'overdue' ? 'Atrasado' : 'Pendente';
    });

    row['Data Exportação'] = new Date().toISOString();
    return row;
  });

  const mainSheet = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Dados Principais');

  // ========== ABA 2: RESUMO POR ELEVAÇÃO ==========
  const elevations = [...new Set(equipment.map(equipmentItem => equipmentItem.elevacao))].sort((a, b) => b - a);
  const elevationSummary = elevations.map(elevation => {
    const equipsInElev = equipment.filter(equipmentItem => equipmentItem.elevacao === elevation);
    return {
      Elevação: elevation,
      'Total Equipamentos': equipsInElev.length,
      'Em Dia': equipsInElev.filter(equipmentItem => equipmentItem.statusGeral === 'ok').length,
      'Atenção': equipsInElev.filter(equipmentItem => equipmentItem.statusGeral === 'warning').length,
      'Crítico': equipsInElev.filter(equipmentItem => equipmentItem.statusGeral === 'critical').length,
      'Atrasado': equipsInElev.filter(equipmentItem => equipmentItem.statusGeral === 'overdue').length,
      '% Crítico/Atrasado': ((equipsInElev.filter(equipmentItem => equipmentItem.statusGeral === 'critical' || equipmentItem.statusGeral === 'overdue').length / equipsInElev.length) * 100).toFixed(1) + '%',
    };
  });

  const elevSheet = XLSX.utils.json_to_sheet(elevationSummary);
  XLSX.utils.book_append_sheet(workbook, elevSheet, 'Resumo por Elevação');

  // ========== ABA 3: SERVIÇOS POR TIPO ==========
  const serviceData = MAINTENANCE_TYPES.map(type => {
    let totalAtrasado = 0;
    let totalCritico = 0;
    let totalAtencao = 0;
    let totalEmDia = 0;
    let totalPendente = 0;

    equipment.forEach(equipmentItem => {
      const maint = equipmentItem.manutencoes.find(maintenanceRecord => maintenanceRecord.typeId === type.id);
      if (maint) {
        if (maint.status === 'overdue') totalAtrasado++;
        else if (maint.status === 'critical') totalCritico++;
        else if (maint.status === 'warning') totalAtencao++;
        else if (maint.status === 'ok') totalEmDia++;
        else totalPendente++;
      }
    });

    return {
      'Tipo de Serviço': type.label,
      'Periodicidade': type.periodicidade,
      'Atrasado': totalAtrasado,
      'Crítico': totalCritico,
      'Atenção': totalAtencao,
      'Em Dia': totalEmDia,
      'Pendente': totalPendente,
      'Total': totalAtrasado + totalCritico + totalAtencao + totalEmDia + totalPendente,
      'Urgentes': totalAtrasado + totalCritico,
      '% Conformidade': ((totalEmDia / (totalAtrasado + totalCritico + totalAtencao + totalEmDia + totalPendente)) * 100).toFixed(1) + '%',
    };
  });

  const serviceSheet = XLSX.utils.json_to_sheet(serviceData);
  XLSX.utils.book_append_sheet(workbook, serviceSheet, 'Serviços por Tipo');

  // ========== ABA 4: TIMELINE (GANTT) ==========
  const timelineData: any[] = [];
  equipment.forEach(equipmentItem => {
    equipmentItem.manutencoes.forEach(maintenanceRecord => {
      if (maintenanceRecord.proximaManutencao) {
        timelineData.push({
          TAG: equipmentItem.tag,
          Área: equipmentItem.area,
          Elevação: equipmentItem.elevacao,
          'Tipo Serviço': maintenanceRecord.label,
          'Periodicidade': maintenanceRecord.periodicidade,
          'Data Programada': maintenanceRecord.proximaManutencao.toLocaleDateString('pt-BR'),
          'Data ISO': maintenanceRecord.proximaManutencao.toISOString().split('T')[0],
          'Dias Restantes': maintenanceRecord.diasRestantes,
          Status: maintenanceRecord.status === 'ok' ? 'Em Dia' :
                  maintenanceRecord.status === 'warning' ? 'Atenção' :
                  maintenanceRecord.status === 'critical' ? 'Crítico' :
                  maintenanceRecord.status === 'overdue' ? 'Atrasado' : 'Pendente',
          'Prioridade': maintenanceRecord.status === 'overdue' ? 1 :
                        maintenanceRecord.status === 'critical' ? 2 :
                        maintenanceRecord.status === 'warning' ? 3 : 4,
        });
      }
    });
  });

  timelineData.sort((itemA, itemB) => {
    if (itemA['Prioridade'] !== itemB['Prioridade']) return itemA['Prioridade'] - itemB['Prioridade'];
    return (itemA['Dias Restantes'] ?? 999) - (itemB['Dias Restantes'] ?? 999);
  });

  const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
  XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline Manutenções');

  // ========== ABA 5: DISTRIBUIÇÃO POR ÁREA ==========
  const areas = [...new Set(equipment.map(equipmentItem => equipmentItem.area))];
  const areaData = areas.map(area => {
    const equipsInArea = equipment.filter(equipmentItem => equipmentItem.area === area);
    return {
      'Área': area,
      'Quantidade': equipsInArea.length,
      'Percentual': ((equipsInArea.length / equipment.length) * 100).toFixed(1) + '%',
      'Em Dia': equipsInArea.filter(equipmentItem => equipmentItem.statusGeral === 'ok').length,
      'Atenção': equipsInArea.filter(equipmentItem => equipmentItem.statusGeral === 'warning').length,
      'Crítico': equipsInArea.filter(equipmentItem => equipmentItem.statusGeral === 'critical').length,
      'Atrasado': equipsInArea.filter(equipmentItem => equipmentItem.statusGeral === 'overdue').length,
    };
  });

  const areaSheet = XLSX.utils.json_to_sheet(areaData);
  XLSX.utils.book_append_sheet(workbook, areaSheet, 'Distribuição por Área');

  // ========== ABA 6: RESUMO GERAL ==========
  const summaryData = [
    { Métrica: 'Total de Sopradores', Valor: equipment.length },
    { Métrica: 'Em Dia', Valor: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'ok').length },
    { Métrica: 'Atenção', Valor: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'warning').length },
    { Métrica: 'Crítico', Valor: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'critical').length },
    { Métrica: 'Atrasado', Valor: equipment.filter(equipmentItem => equipmentItem.statusGeral === 'overdue').length },
    { Métrica: 'Total de Elevações', Valor: elevations.length },
    { Métrica: 'Total de Áreas', Valor: areas.length },
    { Métrica: 'Tipos de Manutenção', Valor: MAINTENANCE_TYPES.length },
    { Métrica: 'Manutenções Urgentes (Total)', Valor: timelineData.filter(timelineItem => timelineItem['Prioridade'] <= 2).length },
    { Métrica: 'Data da Exportação', Valor: new Date().toLocaleDateString('pt-BR') },
    { Métrica: 'Hora da Exportação', Valor: new Date().toLocaleTimeString('pt-BR') },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo Geral');

  XLSX.writeFile(workbook, `manutencao_sopradores_powerbi_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportHistoryCSV(equipment: Equipment[]): void {
  const BOM = '\uFEFF';
  const headers = [
    'TAG', 'Área', 'Elevação', 'Altura (m)', 'Tipo',
    'Tipo de Serviço', 'Periodicidade',
    'Última Execução', 'Próxima Prevista',
    'Dias Restantes', 'Status',
    'Data Conclusão', 'Data Exportação'
  ];

  const rows: string[][] = [];
  const today = new Date();

  equipment.forEach(equipmentItem => {
    equipmentItem.manutencoes.forEach(maintenanceRecord => {
      const statusLabel = maintenanceRecord.status === 'ok' ? 'Em Dia' :
                          maintenanceRecord.status === 'warning' ? 'Atenção' :
                          maintenanceRecord.status === 'critical' ? 'Crítico' :
                          maintenanceRecord.status === 'overdue' ? 'Atrasado' : 'Pendente';

      // "Data Conclusão" is the ultimaManutencao if available
      const dataConclusao = maintenanceRecord.ultimaManutencao
        ? maintenanceRecord.ultimaManutencao.toLocaleDateString('pt-BR')
        : '';

      rows.push([
        equipmentItem.tag,
        equipmentItem.area,
        String(equipmentItem.elevacao),
        String(equipmentItem.altura),
        equipmentItem.tipo,
        maintenanceRecord.label,
        maintenanceRecord.periodicidade,
        maintenanceRecord.ultimaManutencao?.toLocaleDateString('pt-BR') || '',
        maintenanceRecord.proximaManutencao?.toLocaleDateString('pt-BR') || '',
        maintenanceRecord.diasRestantes !== null ? String(maintenanceRecord.diasRestantes) : '',
        statusLabel,
        dataConclusao,
        today.toLocaleDateString('pt-BR'),
      ]);
    });
  });

  const csvContent = BOM + [
    headers.join(';'),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Historico_Manutencao_${today.toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPowerBIData(equipment: Equipment[]): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // Reuse same structure as exportToPowerBI
  const mainData: any[] = equipment.map(equipmentItem => {
    const row: any = {
      TAG: equipmentItem.tag,
      Área: equipmentItem.area,
      Elevação: equipmentItem.elevacao,
      'Altura (m)': equipmentItem.altura,
      Tipo: equipmentItem.tipo,
      'Status Geral': equipmentItem.statusGeral === 'ok' ? 'Em Dia' :
                      equipmentItem.statusGeral === 'warning' ? 'Atenção' :
                      equipmentItem.statusGeral === 'critical' ? 'Crítico' : 'Atrasado',
      'Próxima Manutenção': equipmentItem.proximaManutencaoGeral?.toLocaleDateString('pt-BR') || '',
      'Dias Restantes': equipmentItem.diasRestantesGeral ?? '',
    };
    equipmentItem.manutencoes.forEach(maintenanceRecord => {
      row[maintenanceRecord.label] = maintenanceRecord.proximaManutencao?.toLocaleDateString('pt-BR') || '';
      row[`${maintenanceRecord.label} - Status`] = maintenanceRecord.status === 'ok' ? 'Em Dia' :
                                    maintenanceRecord.status === 'warning' ? 'Atenção' :
                                    maintenanceRecord.status === 'critical' ? 'Crítico' :
                                    maintenanceRecord.status === 'overdue' ? 'Atrasado' : 'Pendente';
    });
    return row;
  });

  const mainSheet = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Dados Principais');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}