/**
 * ETL Operations Interface
 * Main dashboard for managing ETL files with status, actions, and log timeline
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
import {
  FileText,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  Search,
  Filter,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Types for ETL files and logs
interface ETLFile {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'validated' | 'approved' | 'loaded' | 'error';
  organizationId: string;
  fileSize: number;
  processingStartedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  validationSummary?: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warnings: number;
  };
}

interface ETLLog {
  id: string;
  entityType: 'etl_file' | 'etl_run';
  entityId: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const ETLOperations = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<ETLFile[]>([]);
  const [logs, setLogs] = useState<ETLLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ETLFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);

  // Load ETL files on component mount
  useEffect(() => {
    loadETLFiles();
  }, [user]);

  // Load logs when a file is selected
  useEffect(() => {
    if (selectedFile) {
      loadFileLogs(selectedFile.id);
    }
  }, [selectedFile]);

  // Real-time updates for files and logs
  useEffect(() => {
    if (!isRealTimeMode || !user?.organizationId) return;

    const interval = setInterval(() => {
      loadETLFiles();
      if (selectedFile) {
        loadFileLogs(selectedFile.id);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isRealTimeMode, user?.organizationId, selectedFile]);

  const loadETLFiles = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('etl_file')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos ETL:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileLogs = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('etl_run_log')
        .select('*')
        .eq('entity_id', fileId)
        .eq('entity_type', 'etl_file')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs do arquivo:', error);
    }
  };

  const handleProcessFile = async (file: ETLFile) => {
    setProcessingFiles(prev => new Set([...prev, file.id]));

    try {
      // Call the ETL processing function
      const { error } = await supabase.functions.invoke('process-etl-file', {
        body: { fileId: file.id, organizationId: user?.organizationId }
      });

      if (error) throw error;

      // Reload files to get updated status
      await loadETLFiles();
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleValidateFile = async (file: ETLFile) => {
    setProcessingFiles(prev => new Set([...prev, file.id]));

    try {
      const { error } = await supabase.functions.invoke('validate-etl-file', {
        body: { fileId: file.id, organizationId: user?.organizationId }
      });

      if (error) throw error;
      await loadETLFiles();
    } catch (error) {
      console.error('Erro ao validar arquivo:', error);
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleApproveFile = async (file: ETLFile) => {
    setProcessingFiles(prev => new Set([...prev, file.id]));

    try {
      const { error } = await supabase
        .from('etl_file')
        .update({ status: 'approved' })
        .eq('id', file.id);

      if (error) throw error;
      await loadETLFiles();
    } catch (error) {
      console.error('Erro ao aprovar arquivo:', error);
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleLoadFile = async (file: ETLFile) => {
    setProcessingFiles(prev => new Set([...prev, file.id]));

    try {
      const { error } = await supabase.functions.invoke('load-etl-file', {
        body: { fileId: file.id, organizationId: user?.organizationId }
      });

      if (error) throw error;
      await loadETLFiles();
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      uploaded: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      approved: 'bg-purple-100 text-purple-800',
      loaded: 'bg-emerald-100 text-emerald-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      uploaded: Upload,
      processing: Loader2,
      validated: CheckCircle,
      approved: Eye,
      loaded: Download,
      error: AlertTriangle
    };
    const Icon = icons[status as keyof typeof icons] || FileText;
    return <Icon className={`h-4 w-4 ${status === 'processing' ? 'animate-spin' : ''}`} />;
  };

  const getLogLevelColor = (level: string) => {
    const colors = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-red-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    return matchesLevel;
  });

  const canProcess = (file: ETLFile) => file.status === 'uploaded';
  const canValidate = (file: ETLFile) => file.status === 'processing';
  const canApprove = (file: ETLFile) => file.status === 'validated';
  const canLoad = (file: ETLFile) => file.status === 'approved';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Operações ETL</h1>
            <p className="text-muted-foreground">
              Gerencie arquivos ETL, monitore status e visualize logs de processamento
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">Todos os Status</option>
              <option value="uploaded">Carregado</option>
              <option value="processing">Processando</option>
              <option value="validated">Validado</option>
              <option value="approved">Aprovado</option>
              <option value="loaded">Carregado para DW</option>
              <option value="error">Erro</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRealTimeMode(!isRealTimeMode)}
              className={isRealTimeMode ? "bg-green-50 border-green-200" : ""}
            >
              {isRealTimeMode ? (
                <Zap className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRealTimeMode ? "Tempo Real Ativo" : "Tempo Real"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadETLFiles}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">Arquivos ETL</TabsTrigger>
            <TabsTrigger value="logs">Timeline de Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="grid gap-4">
              {filteredFiles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum arquivo ETL encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(file.status)}
                          <div>
                            <CardTitle className="text-lg">{file.filename}</CardTitle>
                            <CardDescription>
                              Carregado em {new Date(file.uploadedAt).toLocaleString('pt-BR')}
                              {file.fileSize && ` • ${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                            </CardDescription>
                          </div>
                        </div>

                        <Badge className={getStatusColor(file.status)}>
                          {file.status === 'uploaded' && 'Carregado'}
                          {file.status === 'processing' && 'Processando'}
                          {file.status === 'validated' && 'Validado'}
                          {file.status === 'approved' && 'Aprovado'}
                          {file.status === 'loaded' && 'Carregado para DW'}
                          {file.status === 'error' && 'Erro'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {file.validationSummary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 bg-muted rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{file.validationSummary.totalRows}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{file.validationSummary.validRows}</div>
                            <div className="text-sm text-muted-foreground">Válidos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{file.validationSummary.errorRows}</div>
                            <div className="text-sm text-muted-foreground">Erros</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{file.validationSummary.warnings}</div>
                            <div className="text-sm text-muted-foreground">Avisos</div>
                          </div>
                        </div>
                      )}

                      {file.errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">{file.errorMessage}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleProcessFile(file)}
                          disabled={!canProcess(file) || processingFiles.has(file.id)}
                          variant={canProcess(file) ? "default" : "secondary"}
                        >
                          {processingFiles.has(file.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Processar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleValidateFile(file)}
                          disabled={!canValidate(file) || processingFiles.has(file.id)}
                          variant={canValidate(file) ? "default" : "secondary"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Validar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApproveFile(file)}
                          disabled={!canApprove(file) || processingFiles.has(file.id)}
                          variant={canApprove(file) ? "default" : "secondary"}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleLoadFile(file)}
                          disabled={!canLoad(file) || processingFiles.has(file.id)}
                          variant={canLoad(file) ? "default" : "secondary"}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Carregar para DW
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Ver Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center gap-4">
              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">Todos os Níveis</option>
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>

              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Logs para: <strong>{selectedFile.filename}</strong>
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Timeline de Logs</CardTitle>
                <CardDescription>
                  Histórico de operações ETL em ordem cronológica
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {selectedFile ? 'Nenhum log encontrado para este arquivo' : 'Selecione um arquivo para ver os logs'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 p-3 border-l-4 border-l-blue-200 bg-slate-50 rounded-r-lg">
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className={getLogLevelColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ETLOperations;