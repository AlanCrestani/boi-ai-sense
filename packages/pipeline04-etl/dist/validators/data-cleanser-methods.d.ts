/**
 * Additional cleaning methods for Pipeline04DataCleanser
 */
export interface CleansingWarning {
    field: string;
    message: string;
    originalValue: any;
    cleanedValue: any;
}
export declare class Pipeline04DataCleanserMethods {
    /**
     * Clean turno field
     */
    protected cleanTurnoField(value: any): {
        cleanedValue: string;
        warning?: Omit<CleansingWarning, 'field'>;
    };
    /**
     * Clean curral code field
     */
    protected cleanCurralField(value: any): {
        cleanedValue: string;
        warning?: Omit<CleansingWarning, 'field'>;
    };
    /**
     * Clean trateiro name field
     */
    protected cleanTrateiroField(value: any): {
        cleanedValue: string;
        warning?: Omit<CleansingWarning, 'field'>;
    };
    /**
     * Clean dieta name field
     */
    protected cleanDietaField(value: any): {
        cleanedValue: string | null;
        warning?: Omit<CleansingWarning, 'field'>;
    };
    /**
     * Clean tipo trato field
     */
    protected cleanTipoTratoField(value: any): {
        cleanedValue: string;
        warning?: Omit<CleansingWarning, 'field'>;
    };
}
