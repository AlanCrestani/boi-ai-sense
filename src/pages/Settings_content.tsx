// Conteúdo das abas para a página Settings
// Este arquivo contém apenas o conteúdo das TabsContent para ser incluído no Settings.tsx

const tabsContent = `
            {/* ABA MAQUINÁRIOS */}
            <TabsContent value="maquinarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Maquinários</CardTitle>
                      <CardDescription>
                        Gerencie tratores, misturadores e outros equipamentos
                      </CardDescription>
                    </div>
                    <Dialog open={isAddMaquinarioOpen} onOpenChange={setIsAddMaquinarioOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Novo Maquinário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Maquinário</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo equipamento
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="maq-codigo">Código *</Label>
                            <Input
                              id="maq-codigo"
                              value={newMaquinario.codigo}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, codigo: e.target.value })}
                              placeholder="Ex: MAQ-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-nome">Nome *</Label>
                            <Input
                              id="maq-nome"
                              value={newMaquinario.nome}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, nome: e.target.value })}
                              placeholder="Ex: Trator John Deere 6110J"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-tipo">Tipo *</Label>
                            <Input
                              id="maq-tipo"
                              value={newMaquinario.tipo}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, tipo: e.target.value })}
                              placeholder="Ex: Trator, Misturador, Carreta"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-marca">Marca</Label>
                            <Input
                              id="maq-marca"
                              value={newMaquinario.marca}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, marca: e.target.value })}
                              placeholder="Ex: John Deere"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-modelo">Modelo</Label>
                            <Input
                              id="maq-modelo"
                              value={newMaquinario.modelo}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, modelo: e.target.value })}
                              placeholder="Ex: 6110J"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-ano">Ano de Fabricação</Label>
                            <Input
                              id="maq-ano"
                              type="number"
                              value={newMaquinario.ano_fabricacao}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, ano_fabricacao: Number(e.target.value) })}
                              placeholder="Ex: 2020"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-capacidade">Capacidade Operacional</Label>
                            <Input
                              id="maq-capacidade"
                              value={newMaquinario.capacidade_operacional}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, capacidade_operacional: e.target.value })}
                              placeholder="Ex: 110 CV, 15 m³"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maq-status">Status</Label>
                            <select
                              id="maq-status"
                              value={newMaquinario.status}
                              onChange={(e) => setNewMaquinario({ ...newMaquinario, status: e.target.value as any })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="ativo">Ativo</option>
                              <option value="manutencao">Manutenção</option>
                              <option value="inativo">Inativo</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddMaquinarioOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddMaquinario}>
                            Cadastrar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead>Capacidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maquinarios.map((maquinario) => (
                        <TableRow key={maquinario.id}>
                          <TableCell className="font-medium">{maquinario.codigo}</TableCell>
                          <TableCell>{maquinario.nome}</TableCell>
                          <TableCell>{maquinario.tipo}</TableCell>
                          <TableCell>
                            {maquinario.marca && maquinario.modelo ?
                              \`\${maquinario.marca} \${maquinario.modelo}\` :
                              maquinario.marca || "-"
                            }
                          </TableCell>
                          <TableCell>{maquinario.ano_fabricacao || "-"}</TableCell>
                          <TableCell>{maquinario.capacidade_operacional || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeColor(maquinario.status)}>
                              {maquinario.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA SETORES */}
            <TabsContent value="setores" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Setores</CardTitle>
                      <CardDescription>
                        Gerencie setores de confinamento, semiconfinamento, pasto, enfermaria e maternidade
                      </CardDescription>
                    </div>
                    <Dialog open={isAddSetorOpen} onOpenChange={setIsAddSetorOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Novo Setor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Setor</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo setor organizacional
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="set-codigo">Código *</Label>
                            <Input
                              id="set-codigo"
                              value={newSetor.codigo}
                              onChange={(e) => setNewSetor({ ...newSetor, codigo: e.target.value })}
                              placeholder="Ex: SET-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-nome">Nome *</Label>
                            <Input
                              id="set-nome"
                              value={newSetor.nome}
                              onChange={(e) => setNewSetor({ ...newSetor, nome: e.target.value })}
                              placeholder="Ex: Setor Principal"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-tipo">Tipo *</Label>
                            <select
                              id="set-tipo"
                              value={newSetor.tipo}
                              onChange={(e) => setNewSetor({ ...newSetor, tipo: e.target.value as any })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="confinamento">Confinamento</option>
                              <option value="semiconfinamento">Semiconfinamento</option>
                              <option value="pasto">Pasto</option>
                              <option value="enfermaria">Enfermaria</option>
                              <option value="maternidade">Maternidade</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-area">Área Total (hectares)</Label>
                            <Input
                              id="set-area"
                              type="number"
                              value={newSetor.area_total_hectares}
                              onChange={(e) => setNewSetor({ ...newSetor, area_total_hectares: Number(e.target.value) })}
                              placeholder="Ex: 500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-descricao">Descrição</Label>
                            <Input
                              id="set-descricao"
                              value={newSetor.descricao}
                              onChange={(e) => setNewSetor({ ...newSetor, descricao: e.target.value })}
                              placeholder="Descrição do setor"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddSetorOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddSetor}>
                            Cadastrar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Área (ha)</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {setores.map((setor) => (
                        <TableRow key={setor.id}>
                          <TableCell className="font-medium">{setor.codigo}</TableCell>
                          <TableCell>{setor.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTipoBadgeColor(setor.tipo)}>
                              {setor.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{setor.area_total_hectares || "-"}</TableCell>
                          <TableCell>{setor.descricao || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA COLABORADORES */}
            <TabsContent value="colaboradores" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Colaboradores</CardTitle>
                      <CardDescription>
                        Gerencie funcionários e suas informações
                      </CardDescription>
                    </div>
                    <Dialog open={isAddColaboradorOpen} onOpenChange={setIsAddColaboradorOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Novo Colaborador
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo funcionário
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="col-codigo">Código *</Label>
                            <Input
                              id="col-codigo"
                              value={newColaborador.codigo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, codigo: e.target.value })}
                              placeholder="Ex: COL-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-nome">Nome Completo *</Label>
                            <Input
                              id="col-nome"
                              value={newColaborador.nome_completo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, nome_completo: e.target.value })}
                              placeholder="Ex: João Silva Santos"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-cargo">Cargo *</Label>
                            <Input
                              id="col-cargo"
                              value={newColaborador.cargo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, cargo: e.target.value })}
                              placeholder="Ex: Operador de Máquinas"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-setor">Setor</Label>
                            <select
                              id="col-setor"
                              value={newColaborador.setor_id}
                              onChange={(e) => setNewColaborador({ ...newColaborador, setor_id: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um setor</option>
                              {setores.map((setor) => (
                                <option key={setor.id} value={setor.id}>
                                  {setor.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-telefone">Telefone</Label>
                            <Input
                              id="col-telefone"
                              value={newColaborador.telefone}
                              onChange={(e) => setNewColaborador({ ...newColaborador, telefone: e.target.value })}
                              placeholder="Ex: (11) 99999-9999"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-email">Email</Label>
                            <Input
                              id="col-email"
                              type="email"
                              value={newColaborador.email}
                              onChange={(e) => setNewColaborador({ ...newColaborador, email: e.target.value })}
                              placeholder="Ex: joao@fazenda.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-admissao">Data de Admissão</Label>
                            <Input
                              id="col-admissao"
                              type="date"
                              value={newColaborador.data_admissao}
                              onChange={(e) => setNewColaborador({ ...newColaborador, data_admissao: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-status">Status</Label>
                            <select
                              id="col-status"
                              value={newColaborador.status}
                              onChange={(e) => setNewColaborador({ ...newColaborador, status: e.target.value as any })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="ativo">Ativo</option>
                              <option value="afastado">Afastado</option>
                              <option value="demitido">Demitido</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddColaboradorOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddColaborador}>
                            Cadastrar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Admissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaboradoresEnriquecidos.map((colaborador) => (
                        <TableRow key={colaborador.id}>
                          <TableCell className="font-medium">{colaborador.codigo}</TableCell>
                          <TableCell>{colaborador.nome_completo}</TableCell>
                          <TableCell>{colaborador.cargo}</TableCell>
                          <TableCell>
                            {colaborador.setor ? (
                              <Badge variant="outline" className={getTipoBadgeColor(colaborador.setor.tipo)}>
                                {colaborador.setor.nome}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{colaborador.telefone || "-"}</div>
                              <div className="text-text-tertiary">{colaborador.email || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(colaborador.data_admissao).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeColor(colaborador.status)}>
                              {colaborador.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}`;

export { tabsContent };