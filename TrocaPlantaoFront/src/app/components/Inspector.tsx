'use client';
import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Heading,
    Text,
    Badge,
    Spacer,
    Accordion,
    Container,
    Card,
    Center,
    Flex,
    Separator,
    SimpleGrid,
    Spinner
} from '@chakra-ui/react';

import {
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    Calendar,
    Clock,
    Briefcase,
    Search,
    RefreshCw,
    Trash2,
    ArrowRightLeft,
    LogOut,
    Filter
} from 'lucide-react';

import { toaster } from '@/app/components/ui/toaster';
import Header from './Header';
import { CheckModal } from './CheckModal';
import { set } from 'react-hook-form';

type Requerente = {
    cpf: string;
    nome: string;
    sobrenome?: string;
    telefone?: string;
    email?: string;
    dataTroca?: string;
    horarioTrocaInit?: string;
    horarioTrocaEnd?: string;
    imagens?: { id: string; caminhoArquivo: string, nomeArquivo: string }[];
};

type Troca = {
    id: string;
    funcaoPlantao?: string;
    unidade?: string;
    requerente?: Requerente[];
    trocaEmAnalise?: boolean;
    aceitaSN?: 'ACEITO' | 'RECUSADO' | 'EM_ANALISE';
    finalizadaEm?: string | null;
    dataCriacao?: string | null;
    nomeInspetor?: string;
    motivoTroca?: string;
};

export default function Inspector({ nomeBase }: { nomeBase: string }) {
    const [allTrocas, setAllTrocas] = useState<Troca[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pendingStatus, setPendingStatus] = useState<'ACEITO' | 'RECUSADO' | null>(null);
    const [nomeInspector, setNomeInspector] = useState("");
    const [motivoRecusa, setMotivoRecusa] = useState("");
    const [loadTroca, setLoadTroca] = useState(false);

    useEffect(() => {
        const nomeSalvo = localStorage.getItem('nomeInspector');
        if (nomeSalvo) {
            setNomeInspector(nomeSalvo);
        }
    }, []);

    useEffect(() => {
        document.title = `Painel do Administrador - ${nomeBase}`;
    }, [nomeBase]);

    // const BackEndURL = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        fetchAllTrocas();
    }, []);

    useEffect(() => {
        console.log(allTrocas);
    }, [allTrocas]);


    async function fetchAllTrocas() {
        setLoading(true);
        try {
            const res = await fetch('/api/trocas');
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            console.log(json);
            setAllTrocas(Array.isArray(json) ? json : []);
        } catch (err: any) {
            toaster.create({ title: 'Erro ao buscar trocas', description: err?.message ?? String(err), type: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id: string, status: 'ACEITO' | 'RECUSADO', nome: string) {
        const backupTrocas = [...allTrocas];

        setAllTrocas(prev =>
            prev.map(t =>
                t.id === id
                    ? { ...t, aceitaSN: status, trocaEmAnalise: false }
                    : t
            )
        );
        setLoadTroca(true);

        toaster.create({
            title: status === 'ACEITO' ? 'Processando aceite...' : 'Processando recusa...',
            type: 'info',
            duration: 3000,
        });
        const nomeLimpo = nome.trim();

        const temNumero = /\d/.test(nomeLimpo);

        if (nomeLimpo.length < 3) {
            toaster.create({
                title: 'Nome muito curto',
                description: 'O nome do administrador deve ter pelo menos 3 letras.',
                type: 'error',
            });
            setLoadTroca(false);
            return;
        }

        if (temNumero) {
            toaster.create({
                title: 'Nome inválido',
                description: 'O nome não pode conter números.',
                type: 'error',
            });
            setLoadTroca(false);
            return;
        }

        try {

            let motivo = motivoRecusa;
            setMotivoRecusa("");

            setOpen(false);
            setLoadTroca(false);


            const res = await fetch(
                `/api/trocas/${encodeURIComponent(id)}?aceitoSN=${status}&nomeInspector=${encodeURIComponent(nome)}${status === 'RECUSADO' ? `&motivoRecusa=${encodeURIComponent(motivo)}` : ''}`,
                { method: 'PUT' }
            );

            if (!res.ok) throw new Error(await res.text());


            toaster.create({
                title: status === 'ACEITO' ? 'Troca confirmada' : 'Troca recusada',
                type: 'success',
                duration: 1000,
            });
            localStorage.setItem('nomeInspector', nomeInspector);
        } catch (err: any) {

            setAllTrocas(backupTrocas);

            toaster.create({
                title: 'Erro ao sincronizar',
                description: 'Não foi possível salvar a alteração. Tente novamente.',
                type: 'error',
                duration: 3000,
            });
        }
    }

    function prepararAcao(id: string, status: 'ACEITO' | 'RECUSADO') {
        setSelectedId(id);
        setPendingStatus(status);
        setOpen(true);
    }

    function confirmarAcao() {
        if (selectedId && pendingStatus) {
            updateStatus(selectedId, pendingStatus, nomeInspector);
        }
    }

    async function remove(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta troca?')) return;
        try {
            const res = await fetch(`/api/trocas/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            toaster.create({ title: 'Deletada', type: 'success', duration: 1000 });
            setAllTrocas(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            toaster.create({ title: 'Erro', description: err?.message ?? String(err), type: 'error', duration: 2000 });
        }
    }

    function renderStatusBadge(t: Troca) {
        const s = t.aceitaSN ?? (t.trocaEmAnalise ? 'EM_ANALISE' : 'EM_ANALISE');
        if (s === 'ACEITO') return (
            <Badge bg="green.600" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <CheckCircle size={14} /> ACEITO
            </Badge>
        );
        if (s === 'RECUSADO') return (
            <Badge bg="red.600" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <XCircle size={14} /> RECUSADO
            </Badge>
        );
        return (
            <Badge bg="orange.500" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <AlertCircle size={14} /> EM ANÁLISE
            </Badge>
        );
    }

    const trocasFiltradas = allTrocas
        .filter(t => {
            let matchesUnidade = false;

            const unidadeTroca = t.unidade ?? "";
            const base = nomeBase.split("_").slice(0, 3).join("_");

            if (nomeBase.endsWith("_APONT")) {
                matchesUnidade = unidadeTroca.startsWith(base);
            } else {
                matchesUnidade = unidadeTroca === nomeBase;
            }

            if (!matchesUnidade) return false;

            if (!matchesUnidade) return false;

            // Filtro de Função
            if (roleFilter && t.funcaoPlantao?.toLowerCase() !== roleFilter.toLowerCase()) {
                return false;
            }

            // Filtro de Data (baseado em finalizadaEm)
            if (dateFilter) {
                const isNotFinalized = !t.finalizadaEm || t.finalizadaEm === '';

                if (!isNotFinalized) {
                    const finalizadaTime = new Date(t.finalizadaEm!).getTime();
                    const filtroTime = new Date(dateFilter).getTime();

                    if (finalizadaTime < filtroTime) {
                        return false;
                    }
                }
            }

            if (!searchQuery) return true;

            const query = searchQuery.toLowerCase();

            const matchesId = t.id?.toLowerCase().includes(query);

            const matchesNome = t.requerente?.some(r => {
                const nomeCompleto = `${r.nome} ${r.sobrenome || ''}`.toLowerCase();
                return nomeCompleto.includes(query) || r.cpf?.includes(query);
            });
            const matchesTroca = t.finalizadaEm?.toLowerCase().includes(query)
                || t.funcaoPlantao?.toLowerCase().includes(query)
                || t.nomeInspetor?.toLowerCase().includes(query);

            return matchesId || matchesNome || matchesTroca;
        })
        .toSorted((a, b) => b.id.localeCompare(a.id));

    // Obter funções únicas para o select de filtro
    const funcoesDisponiveis = Array.from(new Set(allTrocas
        .filter(t => t.unidade === nomeBase && t.funcaoPlantao)
        .map(t => t.funcaoPlantao)
    )).sort();


    function formatarData(dataString?: string | null) {
        if (!dataString) return "—";

        const formatador = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short', // Ex: 04/03/2026
            timeStyle: 'short'  // Ex: 14:30
        });

        const dataFormatada = formatador.format(new Date(dataString));
        console.log(dataFormatada);
        return dataFormatada;
    }

    return (
        <>
            <Header />

            <Box bg="gray.100" minH="100vh" py={{ base: 4, md: 16 }}>

                <Button
                    position="absolute"
                    top={4}
                    right={4}
                    zIndex={1000}
                    size="sm"
                    variant="solid"
                    borderRadius="full"
                    color="white"
                    bg="red.600"
                    borderColor="red.600"
                    _hover={{ bg: "red.400" }}
                    onClick={() => {
                        if (confirm('Deseja realmente sair?')) {
                            fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                                window.location.href = '/login';
                            });
                        }
                    }}
                >
                    <LogOut size={16} />
                </Button>
                <Container maxW="container.xl" px={{ base: 2, md: 8 }}>
                    <Card.Root
                        variant="elevated"
                        boxShadow="2xl"
                        borderRadius={{ base: "xl", md: "3xl" }}
                        overflow="hidden"
                        border="2px solid"
                        borderColor="gray.300"
                        bg="white"
                    >
                        <Card.Header
                            pt={{ base: 8, md: 12 }}
                            pb={{ base: 10, md: 16 }}
                            px={{ base: 4, md: 8 }}
                            textAlign="center"
                        >
                            <Center>
                                <VStack gap={4} maxW="3xl">
                                    <Heading size={{ base: "2xl", md: "4xl" }} fontWeight="black" letterSpacing="tight">
                                        Painel do Administrador
                                    </Heading>
                                    <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" fontWeight="bold">
                                        Gerencie e analise todas as solicitações de troca da unidade <Text as="span" color="blue.800" fontWeight="black">{nomeBase}</Text>
                                    </Text>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={fetchAllTrocas}
                                        loading={loading}
                                        borderRadius="full"
                                        borderColor="blue.800"
                                        color="blue.800"
                                        _hover={{ bg: "blue.50" }}
                                    >
                                        <RefreshCw size={16} style={{ marginRight: '8px' }} /> Atualizar Lista
                                    </Button>
                                </VStack>
                            </Center>
                        </Card.Header>

                        <Card.Body p={{ base: 4, md: 10 }} mt={-10} bg="white" borderRadius={{ base: "2xl", md: "4xl" }}>
                            <VStack gap={4} mb={6} align="stretch">
                                <Box position="relative">
                                    <HStack gap={4} flexWrap="wrap">
                                        <Box position="relative" flex="1" minW="250px">
                                            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" zIndex={10} color="gray.400">
                                                <Search size={20} />
                                            </Box>
                                            <input
                                                placeholder="Pesquisar por ID, Nome ou CPF..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 12px 12px 48px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #E2E8F0',
                                                    fontSize: '16px',
                                                    outline: 'none',
                                                }}
                                            />
                                        </Box>

                                        <HStack gap={2} flexWrap="wrap">
                                            <Box position="relative">
                                                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={10} color="gray.400">
                                                    <Calendar size={18} />
                                                </Box>
                                                <input
                                                    type="date"
                                                    value={dateFilter}
                                                    onChange={(e) => setDateFilter(e.target.value)}
                                                    style={{
                                                        padding: '10px 12px 10px 40px',
                                                        borderRadius: '12px',
                                                        border: '2px solid #E2E8F0',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        backgroundColor: 'white',
                                                        fontWeight: 'bold',
                                                        color: '#2D3748'
                                                    }}
                                                />
                                            </Box>

                                            <Box position="relative">
                                                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={10} color="gray.400">
                                                    <Briefcase size={18} />
                                                </Box>
                                                <select
                                                    value={roleFilter}
                                                    onChange={(e) => setRoleFilter(e.target.value)}
                                                    style={{
                                                        padding: '10px 12px 10px 40px',
                                                        borderRadius: '12px',
                                                        border: '2px solid #E2E8F0',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        backgroundColor: 'white',
                                                        fontWeight: 'bold',
                                                        color: '#2D3748',
                                                        minWidth: '150px'
                                                    }}
                                                >
                                                    <option value="">Todas as Funções</option>
                                                    {funcoesDisponiveis.map(f => (
                                                        <option key={f} value={f}>{f}</option>
                                                    ))}
                                                </select>
                                            </Box>

                                            {(searchQuery || dateFilter || roleFilter) && (
                                                <Button
                                                    variant="ghost"
                                                    color="red.500"
                                                    fontWeight="bold"
                                                    onClick={() => {
                                                        setSearchQuery("");
                                                        setDateFilter("");
                                                        setRoleFilter("");
                                                    }}
                                                >
                                                    Limpar Filtros
                                                </Button>
                                            )}
                                        </HStack>
                                    </HStack>
                                </Box>
                            </VStack>

                            {loading ? (
                                <Center py={20}>
                                    <VStack gap={4}>
                                        <Spinner size="xl" color="blue.800" />
                                        <Text fontWeight="bold" color="blue.800">Buscando trocas...</Text>
                                    </VStack>
                                </Center>
                            ) : trocasFiltradas.length === 0 ? (
                                <Center py={20} flexDir="column" gap={4}>
                                    <Search size={48} color="gray.400" />
                                    <Text fontSize="xl" fontWeight="bold" color="gray.500">
                                        Nenhuma troca encontrada.
                                    </Text>
                                </Center>
                            ) : (
                                <VStack gap={6} align="stretch">

                                    <Accordion.Root multiple variant="enclosed" borderRadius="2xl" overflow="hidden">
                                        {trocasFiltradas.map((troca) => (
                                            <Accordion.Item key={troca.id} value={troca.id} border="2px solid" borderColor="gray.200" mb={4} borderRadius="2xl" overflow="hidden">
                                                <Accordion.ItemTrigger p={{ base: 4, md: 6 }} _hover={{ bg: "gray.50" }}>
                                                    <Flex flex="1" flexDir={{ base: "column", md: "row" }} align={{ base: "start", md: "center" }} gap={8}>
                                                        <VStack align="start" gap={0}>
                                                            <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase">ID DA TROCA</Text>
                                                            <Heading size="sm" fontWeight="black">{troca.id}</Heading>
                                                        </VStack>
                                                        <VStack align="start" gap={0}>
                                                            <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase">Criada em:</Text>
                                                            <Heading size="sm" fontWeight="black">  {formatarData(troca.dataCriacao) || "Não criada"} </Heading>
                                                        </VStack>
                                                        <VStack align="start" gap={0}>
                                                            <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase">Finalizada</Text>
                                                            <Heading size="sm" fontWeight="black">  {formatarData(troca.finalizadaEm) || "Não finalizada"} </Heading>
                                                        </VStack>
                                                        {troca.nomeInspetor && (
                                                            <VStack align="start" gap={0}>
                                                                <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase">Analista</Text>
                                                                <Heading size="sm" fontWeight="black">  {troca.nomeInspetor} </Heading>
                                                            </VStack>
                                                        )}



                                                        <Spacer display={{ base: "none", md: "block" }} />

                                                        <HStack gap={6} flexWrap="wrap">
                                                            <VStack align="start" gap={0}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.500">FUNÇÃO</Text>
                                                                <Text fontWeight="bold" display="flex" alignItems="center" gap={1}><Briefcase size={14} /> {troca.funcaoPlantao}</Text>
                                                            </VStack>
                                                            <Box pt={2}>
                                                                {renderStatusBadge(troca)}
                                                            </Box>
                                                        </HStack>
                                                    </Flex>
                                                    <Accordion.ItemIndicator />
                                                </Accordion.ItemTrigger>

                                                <Accordion.ItemContent bg="gray.50" p={{ base: 4, md: 8 }}>
                                                    <VStack align="stretch" gap={8}>
                                                        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                                                            <Heading size="md" color="gray.800" fontWeight="bold" display="flex" alignItems="center" gap={2}>
                                                                <ArrowRightLeft size={20} color="blue.800" /> Detalhes da Substituição | {troca.id}
                                                            </Heading>


                                                            <HStack gap={3}>

                                                                <>
                                                                    <Button size="md" bg="green.600" color="white" _hover={{ bg: "green.700" }} fontWeight="bold" onClick={() => prepararAcao(troca.id, 'ACEITO')}>
                                                                        <CheckCircle size={18} style={{ marginRight: '8px' }} /> Aceitar
                                                                    </Button>
                                                                    <Button size="md" bg="red.600" color="white" _hover={{ bg: "red.700" }} fontWeight="bold" onClick={() => prepararAcao(troca.id, 'RECUSADO')}>
                                                                        <XCircle size={18} style={{ marginRight: '8px' }} /> Recusar
                                                                    </Button>
                                                                </>
                                                                <Button size="md" variant="ghost" color="red.600" _hover={{ bg: "red.50" }} onClick={() => remove(troca.id)}>
                                                                    <Trash2 size={18} />
                                                                </Button>
                                                            </HStack>
                                                        </Flex>
                                                        {troca.motivoTroca && (
                                                            <Heading size="md" color="gray.800" fontWeight="bold" display="flex" alignItems="center" gap={2}>
                                                                <ArrowRightLeft size={20} color="blue.800" /> Motivo da Recusa: {troca.motivoTroca}
                                                            </Heading>
                                                        )}

                                                        {/* Exibição dos Requerentes (Titular e Substituto) */}
                                                        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                                                            {troca.requerente && troca.requerente.length > 0 ? (
                                                                troca.requerente.map((r, idx) => (

                                                                    <Card.Root key={r.cpf + idx} variant="outline" border="2px solid" borderColor="gray.200" borderRadius="xl" bg="white" boxShadow="sm">
                                                                        <Card.Body p={6}>
                                                                            <VStack align="start" gap={4}>
                                                                                <Flex w="full" justify="space-between" align="center">
                                                                                    <Badge
                                                                                        bg={idx === 0 ? "blue.100" : "orange.100"}
                                                                                        color={idx === 0 ? "blue.800" : "orange.800"}
                                                                                        px={3} py={1} borderRadius="md" fontWeight="black" fontSize="xs"
                                                                                    >
                                                                                        {idx === 0 ? "PROFISSIONAL TITULAR" : "PROFISSIONAL SUBSTITUTO"}
                                                                                    </Badge>
                                                                                    <User size={20} color={idx === 0 ? "blue.400" : "orange.400"} />
                                                                                </Flex>

                                                                                <Box>
                                                                                    <Heading size="sm" color="gray.900" fontWeight="black">
                                                                                        {r.nome} {r.sobrenome}
                                                                                    </Heading>
                                                                                    <Text fontSize="sm" color="gray.500" fontWeight="bold">CPF: {r.cpf}</Text>
                                                                                </Box>

                                                                                <Separator borderColor="gray.100" />

                                                                                <SimpleGrid columns={2} w="full" gap={4}>
                                                                                    <VStack align="start" gap={0}>
                                                                                        <Text fontSize="xs" color="gray.500" fontWeight="black">DATA DO PLANTÃO</Text>
                                                                                        <Text fontSize="sm" fontWeight="bold" display="flex" alignItems="center" gap={1}><Calendar size={14} /> {r.dataTroca || 'N/A'}</Text>
                                                                                    </VStack>
                                                                                    <VStack align="start" gap={0}>
                                                                                        <Text fontSize="xs" color="gray.500" fontWeight="black">HORÁRIO</Text>
                                                                                        <Text fontSize="sm" fontWeight="bold" display="flex" alignItems="center" gap={1}><Clock size={14} /> {r.horarioTrocaInit} - {r.horarioTrocaEnd}</Text>
                                                                                    </VStack>
                                                                                </SimpleGrid>

                                                                                <VStack align="start" gap={1} w="full" pt={2}> <Text fontSize="sm" display="flex" alignItems="center" gap={2}><Text as="span" color="gray.500" fontWeight="bold">Telefone:</Text> <Text fontWeight="bold" >{r.telefone || 'Não informado'}</Text></Text> <Text fontSize="sm" display="flex" alignItems="center" gap={2}><Text as="span" color="gray.500" fontWeight="bold">E-mail:</Text><Text fontWeight="bold" > {r.email || 'Não informado'} </Text></Text> </VStack>
                                                                                <Separator borderColor="gray.100" />

                                                                                <VStack align="start" gap={1} w="full" pt={2}>
                                                                                    {r.imagens?.map(img => (
                                                                                        <img
                                                                                            key={img.id}
                                                                                            src={`/api/uploads/${img.nomeArquivo}`}
                                                                                            alt={img.nomeArquivo}
                                                                                            width={1200}
                                                                                            style={{ borderRadius: 8 }}
                                                                                        />
                                                                                    ))}
                                                                                </VStack>
                                                                            </VStack>
                                                                        </Card.Body>
                                                                    </Card.Root>
                                                                ))
                                                            ) : (
                                                                <Center p={10} w="full">
                                                                    <Text color="gray.500">Nenhum dado de profissional encontrado.</Text>
                                                                </Center>
                                                            )}
                                                        </SimpleGrid>
                                                    </VStack>
                                                </Accordion.ItemContent>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion.Root>
                                </VStack>
                            )}
                        </Card.Body>
                    </Card.Root>
                </Container>

                <CheckModal
                    open={open}
                    onOpenChange={setOpen}
                    pendingStatus={pendingStatus}
                    nomeInspector={nomeInspector}
                    setNomeInspector={setNomeInspector}
                    motivoRecusa={motivoRecusa}
                    setMotivoRecusa={setMotivoRecusa}
                    onConfirm={confirmarAcao}
                    isLoading={loadTroca}
                />
            </Box>
        </>
    );
}
