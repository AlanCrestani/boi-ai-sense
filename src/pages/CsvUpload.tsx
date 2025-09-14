import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function CsvUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const csvFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
    const invalidFiles = selectedFiles.filter(file => !file.name.toLowerCase().endsWith('.csv'));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalidFiles.length} arquivo(s) não são CSV e foram ignorados.`,
        variant: "destructive"
      });
    }
    
    // Limit to 5 files total
    const currentFileCount = files.length;
    const availableSlots = 5 - currentFileCount;
    const filesToAdd = csvFiles.slice(0, availableSlots);
    
    if (csvFiles.length > availableSlots) {
      toast({
        title: "Limite excedido",
        description: `Apenas ${availableSlots} arquivo(s) podem ser adicionados. Limite máximo: 5 arquivos.`,
        variant: "destructive"
      });
    }
    
    const newFiles: UploadFile[] = filesToAdd.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];
        if (uploadFile.status !== 'pending') continue;

        // Update status to uploading
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const } : f
        ));

        // Determine folder based on file name prefix
        let folder = "";
        const fileName = uploadFile.file.name;
        
        if (fileName.startsWith("01")) folder = "01";
        else if (fileName.startsWith("02")) folder = "02";
        else if (fileName.startsWith("03")) folder = "03";
        else if (fileName.startsWith("04")) folder = "04";
        else if (fileName.startsWith("05")) folder = "05";
        else {
          console.error(`Arquivo ${fileName} não segue padrão esperado`);
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: 'error' as const, 
              error: 'Nome do arquivo não segue padrão esperado (deve começar com 01, 02, 03, 04 ou 05)'
            } : f
          ));
          continue;
        }

        const filePath = `${folder}/${fileName}`;
        
        try {
          const { error } = await supabase.storage
            .from('csv-uploads')
            .upload(filePath, uploadFile.file, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) throw error;

          console.log(`✅ ${fileName} enviado para ${folder}/`);

          // Update status to completed
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
          ));

        } catch (error) {
          console.error('Erro no upload:', error);
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            } : f
          ));
        }
      }

      const completedCount = files.filter(f => f.status === 'completed').length;
      if (completedCount > 0) {
        toast({
          title: "Upload concluído",
          description: `${completedCount} arquivo(s) enviado(s) com sucesso!`,
        });
      }

    } catch (error) {
      console.error('General upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro durante o upload dos arquivos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Upload de CSV</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Upload de CSV</h1>
          <p className="text-text-secondary">
            Envie até 5 arquivos CSV para atualizar o banco de dados
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Selecionar Arquivos CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="csv-files">
                  Escolha arquivos CSV (máximo 5)
                </Label>
                <Input
                  id="csv-files"
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={files.length >= 5 || isUploading}
                  className="max-w-md"
                />
              </div>
              
              <div className="text-sm text-text-tertiary">
                • Apenas arquivos .csv são aceitos
                • Tamanho máximo: 20MB por arquivo
                • Limite: 5 arquivos por upload
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Arquivos Selecionados ({files.length}/5)</CardTitle>
              {completedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Concluídos
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((uploadFile, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {uploadFile.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : uploadFile.status === 'error' ? (
                        <Trash2 className="h-5 w-5 text-destructive" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {uploadFile.file.name}
                        </p>
                        <span className="text-xs text-text-tertiary">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-2" />
                      )}
                      
                      {uploadFile.status === 'error' && uploadFile.error && (
                        <p className="text-xs text-destructive mt-1">
                          Erro: {uploadFile.error}
                        </p>
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <p className="text-xs text-primary mt-1">
                          Upload concluído
                        </p>
                      )}
                    </div>
                    
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {pendingFiles.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={uploadFiles}
              disabled={isUploading}
              size="lg"
              className="min-w-48"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar {pendingFiles.length} arquivo(s)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}