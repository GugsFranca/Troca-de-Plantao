'use client';

import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Button,
    Field,
    Input,
    VStack,
    Heading,
    Separator,
    Text,
    Card,
    Container,
    SimpleGrid,
    Stack,
    RadioGroup,
    Badge,
    Flex,
    Center,
    Link
} from '@chakra-ui/react';

import {
    FileText,
    MapPin,
    Upload,
    Send,
    Info
} from 'lucide-react';

import { toaster } from "@/app/components/ui/toaster";
import { FormValues, FUNCOES_PLANTAO, UNIDADES_ATUACAO } from '../type';

import { useState } from 'react';
import Header from './Header';
import SuccessTrocaDialog from './ui/SuccessTrocaModal';

export default function TrocaForm() {

    const [resetKey, setResetKey] = useState(0); // Adicione este estado
    const [showSuccess, setShowSuccess] = useState(false);
    const [trocaId, setTrocaId] = useState<string | null>(null);

    const { control, handleSubmit, register, reset, formState: { isSubmitting }, setFocus, formState: { errors }, setValue } = useForm<FormValues>({
        shouldFocusError: true,

        defaultValues: {
            pri_nome: '',
            sec_nome: '',
            pri_sobrenome: '',
            sec_sobrenome: '',
            pri_cpf: '',
            sec_cpf: '',
            pri_matricula: '',
            sec_matricula: '',
            pri_telefone: '',
            sec_telefone: '',
            pri_email: '',
            sec_email: '',
            pri_dataTroca: '',
            sec_dataTroca: '',
            pri_horarioInit: '',
            sec_horarioInit: '',
            pri_horarioEnd: '',
            sec_horarioEnd: '',
            pri_files: null,
            sec_files: null,
            unidade: undefined,
            funcaoPlantao: undefined
        },
    });
    async function onSubmit(data: FormValues) {
        try {
            const pri = {
                cpf: data.pri_cpf ?? null,
                matricula: data.pri_matricula ?? null,
                nome: data.pri_nome ?? null,
                sobrenome: data.pri_sobrenome ?? null,
                telefone: data.pri_telefone ?? null,
                email: data.pri_email ?? null,
                dataTroca: data.pri_dataTroca ?? null,
                horarioTrocaInit: data.pri_horarioInit ?? null,
                horarioTrocaEnd: data.pri_horarioEnd ?? null
            };

            const sec = {
                cpf: data.sec_cpf ?? null,
                matricula: data.sec_matricula ?? null,
                nome: data.sec_nome ?? null,
                sobrenome: data.sec_sobrenome ?? null,
                telefone: data.sec_telefone ?? null,
                email: data.sec_email ?? null,
                dataTroca: data.sec_dataTroca ?? null,
                horarioTrocaInit: data.sec_horarioInit ?? null,
                horarioTrocaEnd: data.sec_horarioEnd ?? null
            };

            if (requerentesSaoIguais(pri, sec)) {
                alert("Os dois requerentes não podem ser a mesma pessoa na mesma data e horário.");
                return;
            }

            const dados = {
                troca: { funcaoPlantao: data.funcaoPlantao, unidade: data.unidade },
                pri_requerente: pri,
                sec_requerente: sec,
            };

            const form = new FormData();
            form.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));

            if (data.pri_files) {
                for (let i = 0; i < data.pri_files.length; i++) form.append('pri_file', data.pri_files[i]);
            }
            if (data.sec_files) {
                for (let i = 0; i < data.sec_files.length; i++) form.append('sec_file', data.sec_files[i]);
            }

            const res = await fetch('/api/trocas', {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}` + text);
            }

            const json = await res.json();

            setTrocaId(json.id);
            setShowSuccess(true);

            reset();
            setResetKey(prev => prev + 1);


        } catch (err: any) {
            console.error(err);
            toaster.create({
                title: 'Erro ao criar troca',
                description: err.message ?? String(err),
                type: 'error',
                duration: 3000
            });
        }
    }
    function requerentesSaoIguais(pri: any, sec: any) {
        return (
            pri.cpf === sec.cpf ||
            pri.matricula === sec.matricula ||
            pri.nome?.trim().toLowerCase() === sec.nome?.trim().toLowerCase() &&
            pri.sobrenome?.trim().toLowerCase() === sec.sobrenome?.trim().toLowerCase() &&
            pri.dataTroca === sec.dataTroca &&
            pri.horarioTrocaInit === sec.horarioTrocaInit &&
            pri.horarioTrocaEnd === sec.horarioTrocaEnd
        );
    }

    const onError = (errors: any) => {
        const firstError = Object.keys(errors)[0];

        const el = document.querySelector(
            `[data-field="${firstError}"]`
        );

        el?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

    async function fetchByCpf(cpf: string, tipo: 'pri' | 'sec') {
        if (cpf.length !== 14) return;

        try {
            const res = await fetch(`/api/trocas/requerente/${cpf}`);

            if (res.status === 404) {
                console.info('CPF não cadastrado — entrada manual');
                return;
            }

            if (!res.ok) {
                console.warn('Erro inesperado na busca CPF');
                return;
            }

            const data = await res.json();
            if (!data) return;
            if (data.nome === null || data.sobrenome == null || data.email == null || data.telefone == null) {
                return;
            }

            setValue(tipo === 'pri' ? 'pri_nome' : 'sec_nome', data.nome ?? '');
            setValue(tipo === 'pri' ? 'pri_matricula' : 'sec_matricula', data.matricula ?? '')
            setValue(tipo === 'pri' ? 'pri_sobrenome' : 'sec_sobrenome', data.sobrenome ?? '');
            setValue(tipo === 'pri' ? 'pri_email' : 'sec_email', data.email ?? '');
            setValue(tipo === 'pri' ? 'pri_telefone' : 'sec_telefone', data.telefone ?? '');

        } catch (err) {
            console.error('Falha na consulta CPF:', err);
        }
    }

    function cpfField(type: 'pri' | 'sec') {
        const format = type === 'pri' ? 'pri_cpf' : 'sec_cpf';
        return register(format, {
            required: "CPF é obrigatório",
            validate: (v: any) =>
                v.replace(/\D/g, '').length === 11 || "CPF deve ter 11 números"
        });
    }

    function formatCPF(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 11);

        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
        if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    }

    function matriculaField(type: 'pri' | 'sec') {
        const format = type === 'pri' ? 'pri_matricula' : 'sec_matricula';
        return register(format, {
            required: "Matrícula é obrigatória",
            validate: (v: any) =>
                v.replace(/\D/g, '').length === 6 || "Matrícula deve ter 6 números"
        });
    }

    function formatMatricula(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 6);

        if (digits.length <= 5) return digits;
        return digits.replace(/(\d{5})(\d)/, '$1-$2');
    }
    function telefoneField(type: 'pri' | 'sec') {
        const format = type === 'pri' ? 'pri_telefone' : 'sec_telefone';
        return register(format, {
            required: "Telefone é obrigatório",
            validate: (v: any) => {
                const len = v.replace(/\D/g, '').length;
                return (len === 10 || len === 11) || "Telefone inválido";
            }
        });
    }

    function formatTelefone(value: string) {
        const digits = value.replace(/\D/g, '').slice(0, 11);

        if (digits.length <= 2) return digits;

        if (digits.length <= 7) {
            return digits.replace(/(\d{2})(\d+)/, '($1) $2');
        }

        return digits.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
    }

    const today = new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split("T")[0]


    return (
        <>
            <Header />
            <Box bg="gray.100" minH="100vh" py={{ base: 4, md: 16 }}>
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
                        {/* Header */}
                        <Card.Header
                            pt={{ base: 8, md: 12 }}
                            pb={{ base: 6, md: 9 }}
                            px={{ base: 4, md: 8 }}
                            textAlign="center"
                        >
                            <Center>
                                <VStack gap={4} maxW="3xl">
                                    <Heading size={{ base: "2xl", md: "4xl" }} fontWeight="black" letterSpacing="tight">
                                        Troca de Plantão
                                    </Heading>
                                </VStack>
                            </Center>
                        </Card.Header>

                        <Card.Body p={{ base: 4, md: 14 }} mt={-10} bg="white" borderRadius={{ base: "2xl", md: "4xl" }}>
                            <form onSubmit={handleSubmit(onSubmit, onError)}>
                                <VStack gap={{ base: 8, md: 16 }} align="stretch">

                                    {/* Seção 1: Informações do Plantão */}
                                    <VStack gap={{ base: 6, md: 10 }} align="center">
                                        <Flex align="center" gap={3} direction="column">
                                            <Heading size={{ base: "lg", md: "xl" }} color="gray.900" fontWeight="bold" textAlign="center">
                                                Informações Gerais
                                            </Heading>
                                            <Text color="gray.600" fontSize={{ base: "md", md: "lg" }} textAlign="center">Selecione a função e a unidade onde ocorrerá o plantão.</Text>
                                        </Flex>

                                        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={{ base: 6, md: 10 }} w="full">
                                            <Field.Root required invalid={!!errors.funcaoPlantao} data-field="funcaoPlantao"
                                                display="flex" flexDirection="column" alignItems="center">
                                                <Field.Label fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="gray.800" mb={4} display="flex" alignItems="center" gap={2} justifyContent="center">
                                                    <FileText size={20} /> Função do Plantão
                                                </Field.Label>

                                                <Controller
                                                    name="funcaoPlantao"
                                                    control={control}
                                                    rules={{
                                                        required: "Selecione a função do plantão",
                                                        validate: v => !!v || "Seleção inválida"
                                                    }} render={({ field }) => (
                                                        <RadioGroup.Root
                                                            key={`funcao-${resetKey}`}
                                                            value={field.value}
                                                            onValueChange={(e) => field.onChange(e.value)}
                                                            size="lg"
                                                            colorPalette="blue"
                                                            w="full"
                                                        >
                                                            <Stack gap={6} w="full">
                                                                {FUNCOES_PLANTAO.map((grupo) => (
                                                                    <Box key={grupo.grupo} p={{ base: 4, md: 6 }} border="2px solid" borderColor={"gray.200"} borderRadius="2xl" bg="gray.50">
                                                                        <Text fontWeight="black" fontSize="sm" color="blue.800" textTransform="uppercase" mb={4} letterSpacing="widest" textAlign={{ base: "center", md: "left" }}>
                                                                            {grupo.grupo}
                                                                        </Text>
                                                                        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                                                                            {grupo.items.map((item) => (
                                                                                <RadioGroup.Item key={item.value} value={item.value} cursor="pointer" p={2} _hover={{ bg: "blue.50", borderRadius: "md" }}>
                                                                                    <RadioGroup.ItemHiddenInput />
                                                                                    <RadioGroup.ItemControl borderColor="gray.400" borderWidth="2px" />
                                                                                    <RadioGroup.ItemText fontWeight="bold" fontSize="md" color="gray.800">
                                                                                        {item.label}
                                                                                    </RadioGroup.ItemText>
                                                                                </RadioGroup.Item>
                                                                            ))}
                                                                        </SimpleGrid>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </RadioGroup.Root>
                                                    )}
                                                />
                                                <Field.ErrorText>
                                                    {errors.funcaoPlantao?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.unidade} data-field="unidade"
                                                display="flex" flexDirection="column" alignItems="center">
                                                <Field.Label fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="gray.800" mb={4} display="flex" alignItems="center" gap={2} justifyContent="center">
                                                    <MapPin size={20} /> Unidade de Atuação
                                                </Field.Label>

                                                <Controller
                                                    name="unidade"
                                                    control={control}
                                                    rules={{
                                                        required: "Selecione a unidade de atuação",
                                                        validate: v => !!v || "Seleção inválida"
                                                    }} render={({ field }) => (
                                                        <RadioGroup.Root
                                                            key={`unidade-${resetKey}`}
                                                            value={field.value}
                                                            onValueChange={(e) => field.onChange(e.value)}
                                                            size="lg"
                                                            colorPalette="blue"
                                                            w="full"
                                                        >
                                                            <Box p={{ base: 4, md: 6 }} border="2px solid" borderColor={"gray.200"} borderRadius="2xl" bg="gray.50">
                                                                <VStack align={{ base: "center", md: "start" }} gap={4}>
                                                                    {UNIDADES_ATUACAO.items.map((item) => (
                                                                        <RadioGroup.Item key={item.value} value={item.value} cursor="pointer" p={2} w="full" _hover={{ bg: "blue.50", borderRadius: "md" }}>
                                                                            <RadioGroup.ItemHiddenInput />
                                                                            <RadioGroup.ItemControl borderColor="gray.400" borderWidth="2px" />
                                                                            <RadioGroup.ItemText fontWeight="bold" fontSize="md" color="gray.800">
                                                                                {item.label}
                                                                            </RadioGroup.ItemText>
                                                                        </RadioGroup.Item>
                                                                    ))}
                                                                </VStack>
                                                            </Box>
                                                        </RadioGroup.Root>
                                                    )}
                                                />
                                                <Field.ErrorText>
                                                    {errors.unidade?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </SimpleGrid>
                                    </VStack>

                                    <Separator borderColor="gray.300" borderWidth="1px" />

                                    {/* Seção 2: Requerente Primário */}
                                    <VStack gap={10} align="stretch">
                                        <Center flexDir="column" gap={2}>
                                            <Flex align="center" gap={3}>
                                                <Heading size={{ base: "lg", md: "xl" }} color="gray.900" fontWeight="bold">
                                                    Requerente Primário
                                                </Heading>
                                            </Flex>
                                        </Center>

                                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={{ base: 4, md: 6 }}>
                                            <Field.Root required invalid={!!errors.pri_cpf} data-field="pri_cpf">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2} >
                                                    CPF:
                                                </Field.Label>
                                                <Input
                                                    {...cpfField('pri')}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="000.000.000-00"
                                                    type='tel'
                                                    maxLength={14}
                                                    onBlur={(e) => fetchByCpf(formatCPF(e.target.value), 'pri')}
                                                    onChange={(e) => {
                                                        e.target.value = formatCPF(e.target.value);
                                                        cpfField('pri').onChange(e);
                                                    }}
                                                />
                                                <Field.ErrorText>
                                                    {errors.pri_cpf?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.pri_matricula} data-field="pri_matricula">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Matrícula:</Field.Label>

                                                <Input
                                                    h={{ base: "50px", md: "60px" }}
                                                    {...matriculaField('pri')}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="00000-1"
                                                    type='tel'
                                                    onChange={(e) => {
                                                        e.target.value = formatMatricula(e.target.value);
                                                        matriculaField('pri').onChange(e);
                                                    }}

                                                />

                                                <Field.ErrorText>
                                                    {errors.pri_matricula?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.pri_nome} data-field="pri_nome">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Nome:</Field.Label>

                                                <Input
                                                    h={{ base: "50px", md: "60px" }}
                                                    {...register('pri_nome',
                                                        {
                                                            required: true,
                                                            validate: (v: any) => {
                                                                const digits = v.trim();
                                                                return digits.length >= 3 || "Nome deve ter pelo menos 3 caracteres";
                                                            }
                                                        })}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    type='text'
                                                    placeholder="Ex: João" />


                                                <Field.ErrorText>
                                                    {errors.pri_nome?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.pri_sobrenome} data-field="pri_sobrenome">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Sobrenome:</Field.Label>
                                                <Controller
                                                    name="pri_sobrenome"
                                                    control={control}
                                                    rules={{
                                                        required: "Digite seu primeiro nome",
                                                        validate: v => !!v || "Campo nome não pode ser vazio"
                                                    }} render={({ field }) => (
                                                        <Input {...field}
                                                            h={{ base: "50px", md: "60px" }}
                                                            {...register('pri_sobrenome',
                                                                {
                                                                    required: true,
                                                                    validate: (v: any) => {
                                                                        const digits = v.trim();

                                                                        return digits.length >= 3 || "Sobrenome deve ter pelo menos 3 caracteres";
                                                                    }
                                                                })}
                                                            fontSize="lg"
                                                            variant="outline"
                                                            border="2px solid"
                                                            borderColor="gray.300"
                                                            borderRadius="xl"
                                                            placeholder="Ex: Silva" />
                                                    )}
                                                />
                                                <Field.ErrorText>
                                                    {errors.pri_sobrenome?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.pri_email} data-field="pri_email">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    E-mail:
                                                </Field.Label>
                                                <Input
                                                    {...register("pri_email", {
                                                        required: "Email obrigatório",
                                                        pattern: {
                                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                            message: "Email inválido"
                                                        }
                                                    })}
                                                    type="email"
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="joao@email.com"
                                                />
                                                <Field.ErrorText>
                                                    {errors.pri_email?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.pri_telefone} data-field="pri_telefone">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Telefone:
                                                </Field.Label>
                                                <Input
                                                    {...telefoneField("pri")}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    type="tel"
                                                    placeholder="(00) 00000-0000"
                                                    onChange={(e) => {
                                                        e.target.value = formatTelefone(e.target.value);
                                                        telefoneField("pri").onChange(e);
                                                    }}
                                                />
                                                <Field.ErrorText>
                                                    {errors.pri_telefone?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.pri_dataTroca} data-field="pri_dataTroca">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Data Troca:
                                                </Field.Label>
                                                <Input
                                                    type="date"
                                                    min={new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split("T")[0]}
                                                    max={new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0]}
                                                    {...register('pri_dataTroca', { required: "Data é obrigatória" })}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                />
                                                <Field.ErrorText>
                                                    {errors.pri_dataTroca?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.pri_horarioInit} data-field="pri_horarioInit">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Início:
                                                </Field.Label>
                                                <Input type="time" {...register('pri_horarioInit', {
                                                    required: true,
                                                    validate: (v: any) => {
                                                        const digits = v.replace(/\D/g, '');
                                                        return (digits.length > 0) || "Início é obrigatório";
                                                    }
                                                })} h={{ base: "50px", md: "60px" }} fontSize="lg" variant="outline" border="2px solid" borderColor="gray.300" borderRadius="xl" />
                                                <Field.ErrorText>
                                                    {errors.pri_horarioInit?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.pri_horarioEnd}>
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Fim:
                                                </Field.Label>
                                                <Input type="time"
                                                    {...register('pri_horarioEnd',
                                                        {
                                                            required: true,
                                                            validate: (v: any) => {
                                                                const digits = v.replace(/\D/g, '');
                                                                return (digits.length > 0) || "Fim é obrigatório";
                                                            }
                                                        })}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg" variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl" />
                                                <Field.ErrorText>
                                                    {errors.pri_horarioEnd?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </SimpleGrid>

                                        <Box p={8} bg="gray.50" >
                                            <Field.Root display={'flex'} data-field="pri_files"
                                                alignItems={'center'} justifyContent={'center'} invalid={!!errors.pri_files}
                                            >
                                                <VStack gap={4} align="center">
                                                    <Box color="gray.600">
                                                        <Info size={24} />
                                                    </Box>
                                                    <Field.Label fontSize="md" fontWeight="bold" color="gray.800" textAlign="center" m={0}>
                                                        Documentação Obrigatória (Identidade ou Crachá)
                                                    </Field.Label>

                                                    <Controller
                                                        name="pri_files"
                                                        control={control}
                                                        rules={{
                                                            validate: (files: any | null) => {
                                                                if (!files || files.length === 0) {
                                                                    return "Envie ao menos um arquivo";
                                                                }

                                                                const allowed = ["image/jpeg", "image/png"];

                                                                for (const f of files) {

                                                                    // tipo permitido
                                                                    if (!allowed.includes(f.type)) {
                                                                        return "Somente JPG ou PNG";
                                                                    }
                                                                    if (f.size > 5 * 1024 * 1024) {
                                                                        return "Cada arquivo deve ser menor que 5MB";
                                                                    }
                                                                    if (files.length > 2) {
                                                                        return "Envie no máximo 2 arquivos";
                                                                    }
                                                                    if (files.length < 1) {
                                                                        return "Envie ao menos um arquivo";
                                                                    }
                                                                }

                                                                return true;
                                                            }
                                                        }}
                                                        render={({ field }) => (
                                                            <VStack gap={3}>
                                                                <Input id="file-pri" type="file" accept="image/png, image/jpeg"
                                                                    multiple hidden onChange={(e) => field.onChange(e.target.files)} />
                                                                <Button
                                                                    size="lg"
                                                                    bg="white"
                                                                    color="blue.800"
                                                                    border="2px solid"
                                                                    borderColor={errors.pri_files ? "red.400" : "blue.800"}
                                                                    _hover={{ bg: "blue.800", color: "white" }}
                                                                    fontWeight="bold"
                                                                    h="56px"
                                                                    px={8}
                                                                    onClick={() => document.getElementById("file-pri")?.click()}

                                                                >
                                                                    <Upload size={20} style={{ marginRight: '8px' }} /> Escolher Arquivos
                                                                </Button>
                                                                {field.value && field.value.length > 0 && field.value.length < 3 && (
                                                                    <Badge bg="green.600" color="white" px={4} py={1} borderRadius="full" fontSize="sm">
                                                                        {field.value.length} arquivo(s) selecionado(s)
                                                                    </Badge>
                                                                )}
                                                                {field.value && field.value.length >= 3 && (
                                                                    <Badge bg="red.600" color="white" px={4} py={1} borderRadius="full" fontSize="sm">
                                                                        {field.value.length} arquivos selecionados (máximo 2)
                                                                    </Badge>
                                                                )}

                                                            </VStack>
                                                        )}
                                                    />
                                                </VStack>
                                                <Field.ErrorText>
                                                    {errors.pri_files?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </Box>
                                    </VStack>

                                    <Separator borderColor="gray.300" borderWidth="1px" />

                                    {/* Seção 3: Requerente Secundário */}
                                    <VStack gap={10} align="stretch">
                                        <Center flexDir="column" gap={2}>
                                            <Flex align="center" gap={3}>
                                                <Heading size={{ base: "lg", md: "xl" }} color="gray.900" fontWeight="bold">
                                                    Requerente Secundário
                                                </Heading>
                                            </Flex>
                                        </Center>

                                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={{ base: 4, md: 6 }}>
                                            <Field.Root required invalid={!!errors.sec_cpf} data-field="sec_cpf">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2} >
                                                    CPF:
                                                </Field.Label>
                                                <Input
                                                    {...cpfField('sec')}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="000.000.000-00"
                                                    type='tel'
                                                    maxLength={14}
                                                    onBlur={(e) => fetchByCpf(formatCPF(e.target.value), 'sec')}
                                                    onChange={(e) => {
                                                        e.target.value = formatCPF(e.target.value);
                                                        cpfField('sec').onChange(e);
                                                    }}
                                                />
                                                <Field.ErrorText>
                                                    {errors.sec_cpf?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_matricula} data-field="sec_matricula">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Matrícula:</Field.Label>

                                                <Input
                                                    h={{ base: "50px", md: "60px" }}
                                                    {...matriculaField('sec')}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="00000-1"
                                                    type='tel'
                                                    onChange={(e) => {
                                                        e.target.value = formatMatricula(e.target.value);
                                                        matriculaField('sec').onChange(e);
                                                    }}

                                                />

                                                <Field.ErrorText>
                                                    {errors.sec_matricula?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_nome} data-field="sec_nome">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Nome:</Field.Label>

                                                <Input
                                                    h={{ base: "50px", md: "60px" }}
                                                    {...register('sec_nome',
                                                        {
                                                            required: true,
                                                            validate: (v: any) => {
                                                                const digits = v.trim();

                                                                return digits.length >= 3 || "Nome deve ter pelo menos 3 caracteres";
                                                            }
                                                        })}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="Ex: João" />

                                                <Field.ErrorText>
                                                    {errors.sec_nome?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_sobrenome} data-field="sec_sobrenome">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md">Sobrenome:</Field.Label>
                                                <Controller
                                                    name="sec_sobrenome"
                                                    control={control}
                                                    rules={{
                                                        required: "Digite seu sobrenome",
                                                        validate: v => !!v || "Campo sobrenome não pode ser vazio"
                                                    }}
                                                    render={({ field }) => (
                                                        <Input {...field}
                                                            h={{ base: "50px", md: "60px" }}
                                                            {...register('sec_sobrenome',
                                                                {
                                                                    required: true,
                                                                    validate: (v: any) => {
                                                                        const digits = v.trim();

                                                                        return digits.length >= 3 || "Sobrenome deve ter pelo menos 3 caracteres";
                                                                    }
                                                                })}
                                                            fontSize="lg"
                                                            variant="outline"
                                                            border="2px solid"
                                                            borderColor="gray.300"
                                                            borderRadius="xl"
                                                            placeholder="Ex: Silva" />
                                                    )}
                                                />
                                                <Field.ErrorText>
                                                    {errors.sec_sobrenome?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.sec_email} data-field="sec_email">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    E-mail:
                                                </Field.Label>
                                                <Input
                                                    {...register("sec_email", {
                                                        required: "Email obrigatório",
                                                        pattern: {
                                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                            message: "Email inválido"
                                                        }
                                                    })}
                                                    type="email"
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    placeholder="joao@email.com"
                                                />
                                                <Field.ErrorText>
                                                    {errors.sec_email?.message}
                                                </Field.ErrorText>
                                            </Field.Root>

                                            <Field.Root required invalid={!!errors.sec_telefone} data-field="sec_telefone">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Telefone:
                                                </Field.Label>
                                                <Input
                                                    {...telefoneField("sec")}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                    type="tel"
                                                    placeholder="(00) 00000-0000"
                                                    onChange={(e) => {
                                                        e.target.value = formatTelefone(e.target.value);
                                                        telefoneField("sec").onChange(e);
                                                    }}
                                                />
                                                <Field.ErrorText>
                                                    {errors.sec_telefone?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_dataTroca} data-field="sec_dataTroca">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Data Troca:
                                                </Field.Label>
                                                <Input
                                                    type="date"
                                                    min={new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split("T")[0]}
                                                    max={new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0]}
                                                    {...register('sec_dataTroca', { required: "Data é obrigatória" })}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg"
                                                    variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl"
                                                />
                                                <Field.ErrorText>
                                                    {errors.sec_dataTroca?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_horarioInit} data-field="sec_horarioInit">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Início:
                                                </Field.Label>
                                                <Input type="time" {...register('sec_horarioInit', {
                                                    required: true,
                                                    validate: (v: any) => {
                                                        const digits = v.replace(/\D/g, '');
                                                        return (digits.length > 0) || "Início é obrigatório";
                                                    }
                                                })} h={{ base: "50px", md: "60px" }} fontSize="lg" variant="outline" border="2px solid" borderColor="gray.300" borderRadius="xl" />
                                                <Field.ErrorText>
                                                    {errors.sec_horarioInit?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                            <Field.Root required invalid={!!errors.sec_horarioEnd} data-field="sec_horarioEnd">
                                                <Field.Label fontWeight="bold" color="gray.700" fontSize="md" display="flex" alignItems="center" gap={2}>
                                                    Fim:
                                                </Field.Label>
                                                <Input type="time"
                                                    {...register('sec_horarioEnd',
                                                        {
                                                            required: true,
                                                            validate: (v: any) => {
                                                                const digits = v.replace(/\D/g, '');
                                                                return (digits.length > 0) || "Fim é obrigatório";
                                                            }
                                                        })}
                                                    h={{ base: "50px", md: "60px" }}
                                                    fontSize="lg" variant="outline"
                                                    border="2px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="xl" />
                                                <Field.ErrorText>
                                                    {errors.sec_horarioEnd?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </SimpleGrid>

                                        <Box p={8} bg="gray.50" >
                                            <Field.Root display={'flex'} data-field="sec_files" alignItems={'center'} justifyContent={'center'} invalid={!!errors.sec_files} >
                                                <VStack gap={4} align="center">
                                                    <Box color="gray.600">
                                                        <Info size={24} />
                                                    </Box>
                                                    <Field.Label fontSize="md" fontWeight="bold" color="gray.800" textAlign="center" m={0}>
                                                        Documentação Obrigatória (Identidade ou Crachá)
                                                    </Field.Label>

                                                    <Controller
                                                        name="sec_files"
                                                        control={control}
                                                        rules={{
                                                            validate: (files: any | null) => {
                                                                if (!files || files.length === 0) {
                                                                    return "Envie ao menos um arquivo";
                                                                }

                                                                const allowed = ["image/jpeg", "image/png"];

                                                                for (const f of files) {

                                                                    // tipo permitido
                                                                    if (!allowed.includes(f.type)) {
                                                                        return "Somente JPG ou PNG";
                                                                    }
                                                                    if (f.size > 5 * 1024 * 1024) {
                                                                        return "Cada arquivo deve ser menor que 5MB";
                                                                    }
                                                                    if (files.length > 2) {
                                                                        return "Envie no máximo 2 arquivos";
                                                                    }
                                                                    if (files.length < 1) {
                                                                        return "Envie ao menos um arquivo";
                                                                    }
                                                                }

                                                                return true;
                                                            }
                                                        }}
                                                        render={({ field }) => (
                                                            <VStack gap={3}>
                                                                <Input
                                                                    id="file-sec"
                                                                    type="file"
                                                                    accept="image/png, image/jpeg" multiple hidden onChange={(e) => field.onChange(e.target.files)} />
                                                                <Button
                                                                    size="lg"
                                                                    bg="white"
                                                                    color="blue.800"
                                                                    border="2px solid"
                                                                    borderColor={errors.sec_files ? "red.400" : "blue.800"}
                                                                    _hover={{ bg: "blue.800", color: "white" }}
                                                                    fontWeight="bold"
                                                                    h="56px"
                                                                    px={8}
                                                                    onClick={() => document.getElementById("file-sec")?.click()}
                                                                >
                                                                    <Upload size={20} style={{ marginRight: '8px' }} /> Escolher Arquivos
                                                                </Button>
                                                                {field.value && field.value.length > 0 && field.value.length < 3 && (
                                                                    <Badge bg="green.600" color="white" px={4} py={1} borderRadius="full" fontSize="sm">
                                                                        {field.value.length} arquivo(s) selecionado(s)
                                                                    </Badge>
                                                                )}
                                                                {field.value && field.value.length >= 3 && (
                                                                    <Badge bg="red.600" color="white" px={4} py={1} borderRadius="full" fontSize="sm">
                                                                        {field.value.length} arquivos selecionados (máximo 2)
                                                                    </Badge>
                                                                )}
                                                            </VStack>
                                                        )}
                                                    />
                                                </VStack>
                                                <Field.ErrorText>
                                                    {errors.sec_files?.message}
                                                </Field.ErrorText>
                                            </Field.Root>
                                        </Box>
                                    </VStack>

                                    {/* Botão de Envio */}
                                    <Box>
                                        <Button
                                            type="submit"
                                            size="xl"
                                            width="full"
                                            bg="blue.800"
                                            color="white"
                                            _hover={{ bg: "blue.900", transform: 'scale(1.02)' }}
                                            _active={{ transform: 'scale(0.98)' }}
                                            loading={isSubmitting}
                                            loadingText="Processando solicitação..."
                                            borderRadius="2xl"
                                            height={{ base: "60px", md: "80px" }}
                                            fontSize={{ base: "lg", md: "2xl" }}
                                            fontWeight="black"
                                            boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                            transition="all 0.3s"
                                        >
                                            <Send size={24} style={{ marginRight: '12px' }} /> ENVIAR SOLICITAÇÃO
                                        </Button>
                                        {errors.root?.message && (
                                            <Text color="red.500" mt={2} fontSize="sm">
                                                {errors.root.message}
                                            </Text>
                                        )}
                                    </Box>


                                </VStack>
                                <Text textAlign={'center'} color={'gray.500'} fontSize={'sm'} pt={10}>
                                    Ao clicar em "Enviar Solicitação", o id da troca será gerado e enviado para o e-mail do requerente primário e secundário, onde ambos poderão acompanhar o status da solicitação.
                                </Text>
                            </form>

                        </Card.Body>
                    </Card.Root>
                </Container>
                <Box display={'flex'} justifyContent={'space-evenly'} py={30} >
                    <Link href='/track' color={'gray.400'} _hover={{ color: "blue.800" }}>ACOMPANHAR SOLICITAÇÃO</Link>
                    <Link href='/inspector' color={'gray.400'} _hover={{ color: "blue.800" }}>INSPEÇÃO</Link>
                </Box>
                <SuccessTrocaDialog
                    open={showSuccess}
                    onClose={() => setShowSuccess(false)}
                    trocaId={trocaId}
                />
            </Box>
        </>
    );
}
