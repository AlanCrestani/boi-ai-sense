/**
 * Data Cleanser for Pipeline 04 - Trato por Curral ETL
 * Handles Brazilian data formats and common data quality issues
 */
/**
 * Data cleanser for Pipeline 04 feeding treatment data
 */
export class Pipeline04DataCleanser {
    /**
     * Clean a row of data
     */
    cleanRow(row) {
        const cleaned = {};
        const warnings = [];
        // Clean each field
        for (const [field, value] of Object.entries(row.mapped)) {
            try {
                switch (field) {
                    case 'data_ref':
                        const { cleanedValue: cleanedDate, warning: dateWarning } = this.cleanDateField(value);
                        cleaned[field] = cleanedDate;
                        if (dateWarning)
                            warnings.push({ field, ...dateWarning });
                        break;
                    case 'hora':
                        const { cleanedValue: cleanedTime, warning: timeWarning } = this.cleanTimeField(value);
                        cleaned[field] = cleanedTime;
                        if (timeWarning)
                            warnings.push({ field, ...timeWarning });
                        break;
                    case 'turno':
                        const { cleanedValue: cleanedTurno, warning: turnoWarning } = this.cleanTurnoField(value);
                        cleaned[field] = cleanedTurno;
                        if (turnoWarning)
                            warnings.push({ field, ...turnoWarning });
                        break;
                    case 'curral_codigo':
                        const { cleanedValue: cleanedCurral, warning: curralWarning } = this.cleanCurralField(value);
                        cleaned[field] = cleanedCurral;
                        if (curralWarning)
                            warnings.push({ field, ...curralWarning });
                        break;
                    case 'trateiro':
                        const { cleanedValue: cleanedTrateiro, warning: trateiroWarning } = this.cleanTrateiroField(value);
                        cleaned[field] = cleanedTrateiro;
                        if (trateiroWarning)
                            warnings.push({ field, ...trateiroWarning });
                        break;
                    case 'dieta_nome':
                        const { cleanedValue: cleanedDieta, warning: dietaWarning } = this.cleanDietaField(value);
                        cleaned[field] = cleanedDieta;
                        if (dietaWarning)
                            warnings.push({ field, ...dietaWarning });
                        break;
                    case 'tipo_trato':
                        const { cleanedValue: cleanedTipo, warning: tipoWarning } = this.cleanTipoTratoField(value);
                        cleaned[field] = cleanedTipo;
                        if (tipoWarning)
                            warnings.push({ field, ...tipoWarning });
                        break;
                    case 'quantidade_kg':
                    case 'quantidade_cabecas':
                        const { cleanedValue: cleanedNumber, warning: numberWarning } = this.cleanNumericField(value);
                        cleaned[field] = cleanedNumber;
                        if (numberWarning)
                            warnings.push({ field, ...numberWarning });
                        break;
                    case 'observacoes':
                        const { cleanedValue: cleanedObs, warning: obsWarning } = this.cleanTextField(value);
                        cleaned[field] = cleanedObs;
                        if (obsWarning)
                            warnings.push({ field, ...obsWarning });
                        break;
                    default:
                        // For unknown fields, just clean as text
                        const { cleanedValue: cleanedDefault } = this.cleanTextField(value);
                        cleaned[field] = cleanedDefault;
                        break;
                }
            }
            catch (error) {
                // If cleaning fails, keep original value and add warning
                cleaned[field] = value;
                warnings.push({
                    field,
                    message: `Erro na limpeza do campo: ${error instanceof Error ? error.message : error}`,
                    originalValue: value,
                    cleanedValue: value,
                });
            }
        }
        return { cleaned, warnings };
    }
    /**
     * Clean date field (Brazilian format DD/MM/YYYY to ISO)
     */
    cleanDateField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim();
        // Check if already in ISO format
        if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
            return { cleanedValue: stringValue };
        }
        // Try Brazilian format DD/MM/YYYY
        const brDateMatch = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (brDateMatch) {
            const [, day, month, year] = brDateMatch;
            const paddedDay = day.padStart(2, '0');
            const paddedMonth = month.padStart(2, '0');
            const isoDate = `${year}-${paddedMonth}-${paddedDay}`;
            return {
                cleanedValue: isoDate,
                warning: {
                    message: 'Data convertida do formato brasileiro para ISO',
                    originalValue: value,
                    cleanedValue: isoDate,
                },
            };
        }
        // Try to parse as Date and convert
        try {
            const date = new Date(stringValue);
            if (!isNaN(date.getTime())) {
                const isoDate = date.toISOString().split('T')[0];
                return {
                    cleanedValue: isoDate,
                    warning: {
                        message: 'Data convertida para formato ISO',
                        originalValue: value,
                        cleanedValue: isoDate,
                    },
                };
            }
        }
        catch {
            // Ignore parsing errors
        }
        return { cleanedValue: stringValue };
    }
    /**
     * Clean time field (HH:MM format)
     */
    cleanTimeField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim();
        // Remove common separators and spaces
        let cleaned = stringValue.replace(/[\s\-_]/g, '');
        // Try to extract time pattern
        const timeMatch = cleaned.match(/^(\d{1,2})[:.]?(\d{2})$/);
        if (timeMatch) {
            const [, hours, minutes] = timeMatch;
            const paddedHours = hours.padStart(2, '0');
            const formattedTime = `${paddedHours}:${minutes}`;
            if (formattedTime !== stringValue) {
                return {
                    cleanedValue: formattedTime,
                    warning: {
                        message: 'Formato de hora normalizado',
                        originalValue: value,
                        cleanedValue: formattedTime,
                    },
                };
            }
            return { cleanedValue: formattedTime };
        }
        return { cleanedValue: stringValue };
    }
    /**
     * Clean turno field
     */
    cleanTurnoField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim().toUpperCase();
        // Common turno mappings
        const turnoMappings = {
            'MANHA': 'MANHÃ',
            'MANHÃ': 'MANHÃ',
            'MORNING': 'MANHÃ',
            'TARDE': 'TARDE',
            'AFTERNOON': 'TARDE',
            'NOITE': 'NOITE',
            'NIGHT': 'NOITE',
            'VESPERTINO': 'TARDE',
            'MATUTINO': 'MANHÃ',
            'NOTURNO': 'NOITE',
        };
        const mapped = turnoMappings[stringValue];
        if (mapped && mapped !== stringValue) {
            return {
                cleanedValue: mapped,
                warning: {
                    message: 'Turno normalizado',
                    originalValue: value,
                    cleanedValue: mapped,
                },
            };
        }
        return { cleanedValue: mapped || stringValue };
    }
    /**
     * Clean curral code field
     */
    cleanCurralField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim().toUpperCase();
        // Remove special characters except hyphens and underscores
        const cleaned = stringValue.replace(/[^A-Z0-9\-_]/g, '');
        if (cleaned !== stringValue) {
            return {
                cleanedValue: cleaned,
                warning: {
                    message: 'Código do curral normalizado',
                    originalValue: value,
                    cleanedValue: cleaned,
                },
            };
        }
        return { cleanedValue: cleaned };
    }
    /**
     * Clean trateiro name field
     */
    cleanTrateiroField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim();
        // Capitalize each word properly
        const capitalized = stringValue
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        if (capitalized !== stringValue) {
            return {
                cleanedValue: capitalized,
                warning: {
                    message: 'Nome do trateiro capitalizado',
                    originalValue: value,
                    cleanedValue: capitalized,
                },
            };
        }
        return { cleanedValue: capitalized };
    }
    cleanTrateiroFieldOLD(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim();
        // Normalize multiple spaces to single space
        const cleaned = stringValue.replace(/\s+/g, ' ');
        // Capitalize first letter of each word
        const capitalized = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
        if (capitalized !== stringValue) {
            return {
                cleanedValue: capitalized,
                warning: {
                    message: 'Nome do trateiro normalizado',
                    originalValue: value,
                    cleanedValue: capitalized,
                },
            };
        }
        return { cleanedValue: capitalized };
    }
    /**
     * Clean dieta name field
     */
    cleanDietaField(value) {
        if (!value || value === '' || String(value).trim() === '') {
            return { cleanedValue: null };
        }
        const stringValue = String(value).trim();
        // Normalize multiple spaces to single space
        const cleaned = stringValue.replace(/\s+/g, ' ');
        if (cleaned !== stringValue) {
            return {
                cleanedValue: cleaned,
                warning: {
                    message: 'Nome da dieta normalizado',
                    originalValue: value,
                    cleanedValue: cleaned,
                },
            };
        }
        return { cleanedValue: cleaned };
    }
    /**
     * Clean tipo trato field
     */
    cleanTipoTratoField(value) {
        if (!value || value === '') {
            return { cleanedValue: 'RAÇÃO' }; // Default
        }
        const stringValue = String(value).trim().toUpperCase();
        // Common tipo trato mappings
        const tipoMappings = {
            'RACAO': 'RAÇÃO',
            'RAÇÃO': 'RAÇÃO',
            'FEED': 'RAÇÃO',
            'VOLUMOSO': 'VOLUMOSO',
            'ROUGHAGE': 'VOLUMOSO',
            'MINERAL': 'MINERAL',
            'MEDICAMENTO': 'MEDICAMENTO',
            'MEDICINE': 'MEDICAMENTO',
            'REMEDIO': 'MEDICAMENTO',
        };
        const mapped = tipoMappings[stringValue];
        if (mapped && mapped !== stringValue) {
            return {
                cleanedValue: mapped,
                warning: {
                    message: 'Tipo de trato normalizado',
                    originalValue: value,
                    cleanedValue: mapped,
                },
            };
        }
        return { cleanedValue: mapped || stringValue };
    }
    /**
     * Clean numeric field (handle Brazilian decimal format)
     */
    cleanNumericField(value) {
        if (value === null || value === undefined || value === '') {
            return { cleanedValue: null };
        }
        // If already a number, return it
        if (typeof value === 'number') {
            return { cleanedValue: value };
        }
        const stringValue = String(value).trim();
        // Remove currency symbols and spaces
        let normalized = stringValue.replace(/[R$\s]/g, '');
        // Handle Brazilian decimal format (1.250,50 -> 1250.50)
        const lastCommaIndex = normalized.lastIndexOf(',');
        const lastDotIndex = normalized.lastIndexOf('.');
        if (lastCommaIndex > lastDotIndex) {
            // Comma is decimal separator, dots are thousand separators
            const beforeComma = normalized.substring(0, lastCommaIndex).replace(/\./g, '');
            const afterComma = normalized.substring(lastCommaIndex + 1);
            normalized = beforeComma + '.' + afterComma;
        }
        else if (lastDotIndex > lastCommaIndex) {
            // Dot is decimal separator, commas are thousand separators
            normalized = normalized.replace(/,/g, '');
        }
        const numericValue = parseFloat(normalized);
        if (isNaN(numericValue)) {
            return { cleanedValue: null };
        }
        if (normalized !== stringValue) {
            return {
                cleanedValue: numericValue,
                warning: {
                    message: 'Formato numérico normalizado',
                    originalValue: value,
                    cleanedValue: numericValue,
                },
            };
        }
        return { cleanedValue: numericValue };
    }
    /**
     * Clean text field (general purpose)
     */
    cleanTextField(value) {
        if (!value || value === '') {
            return { cleanedValue: null };
        }
        const stringValue = String(value).trim();
        // Normalize multiple spaces to single space
        const cleaned = stringValue.replace(/\s+/g, ' ');
        if (cleaned !== stringValue) {
            return {
                cleanedValue: cleaned,
                warning: {
                    message: 'Texto normalizado',
                    originalValue: value,
                    cleanedValue: cleaned,
                },
            };
        }
        return { cleanedValue: cleaned };
    }
}
