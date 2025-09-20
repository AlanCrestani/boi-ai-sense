/**
 * Additional cleaning methods for Pipeline04DataCleanser
 */
export class Pipeline04DataCleanserMethods {
    /**
     * Clean turno field
     */
    cleanTurnoField(value) {
        if (!value || value === '') {
            return { cleanedValue: 'MANHÃ' }; // Default
        }
        const stringValue = String(value).trim().toUpperCase();
        // Turno mappings
        const turnoMappings = {
            'MANHA': 'MANHÃ',
            'MANHÃ': 'MANHÃ',
            'MORNING': 'MANHÃ',
            'MATUTINO': 'MANHÃ',
            'TARDE': 'TARDE',
            'VESPERTINO': 'TARDE',
            'AFTERNOON': 'TARDE',
            'NOITE': 'NOITE',
            'NOTURNO': 'NOITE',
            'NIGHT': 'NOITE',
        };
        const mapped = turnoMappings[stringValue] || stringValue;
        if (mapped !== stringValue) {
            return {
                cleanedValue: mapped,
                warning: {
                    message: 'Turno normalizado',
                    originalValue: value,
                    cleanedValue: mapped,
                },
            };
        }
        return { cleanedValue: mapped };
    }
    /**
     * Clean curral code field
     */
    cleanCurralField(value) {
        if (!value || value === '') {
            return { cleanedValue: '' };
        }
        const stringValue = String(value).trim();
        // Remove special characters and normalize
        const cleaned = stringValue
            .replace(/[^A-Za-z0-9\-]/g, '') // Keep only alphanumeric and hyphens
            .toUpperCase();
        if (cleaned !== stringValue) {
            return {
                cleanedValue: cleaned,
                warning: {
                    message: 'Código de curral normalizado',
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
        // Capitalize each word
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
    /**
     * Clean dieta name field
     */
    cleanDietaField(value) {
        if (!value || value === '') {
            return { cleanedValue: null };
        }
        const stringValue = String(value).trim();
        // Basic text cleaning
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
        // Tipo trato mappings
        const tipoMappings = {
            'RACAO': 'RAÇÃO',
            'RAÇÃO': 'RAÇÃO',
            'FEED': 'RAÇÃO',
            'VOLUMOSO': 'VOLUMOSO',
            'ROUGHAGE': 'VOLUMOSO',
            'MINERAL': 'MINERAL',
            'MEDICAMENTO': 'MEDICAMENTO',
            'MEDICINE': 'MEDICAMENTO',
        };
        const mapped = tipoMappings[stringValue] || stringValue;
        if (mapped !== stringValue) {
            return {
                cleanedValue: mapped,
                warning: {
                    message: 'Tipo de trato normalizado',
                    originalValue: value,
                    cleanedValue: mapped,
                },
            };
        }
        return { cleanedValue: mapped };
    }
}
