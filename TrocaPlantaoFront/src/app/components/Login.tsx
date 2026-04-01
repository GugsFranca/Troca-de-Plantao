'use client';
import { useForm } from 'react-hook-form';
import {
    Box,
    Button,
    Field,
    Input,
    VStack,
    Heading,
    Card,
    Container,
    Separator,
} from '@chakra-ui/react';

import { toaster } from "@/app/components/ui/toaster";
import { Lock, LogIn, User } from 'lucide-react';

type LoginForm = { username: string; password: string };

export default function Login() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

    async function onLogin(data: LoginForm) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || `Erro ${res.status}`);
            }

            toaster.create({ title: 'Logado com sucesso', type: 'success', duration: 2000 });
            window.location.href = '/inspector';
        } catch (err: any) {
            toaster.create({
                title: 'Erro de login',
                description: err.message,
                type: 'error',
                duration: 2000
            });
        }
    }

    return (
        <Box bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Container maxW="500px">
                <Card.Root variant="outline" boxShadow="sm" borderRadius="3xl" overflow="hidden" border="2px solid" borderColor="gray.300" >
                    <Card.Body p={8}>
                        <VStack gap={6} align="stretch">
                            <VStack align="center" gap={2} mb={2}>
                                <Heading size="lg" fontWeight="bold" color="gray.800">
                                    Troca de Plantão
                                </Heading>
                            </VStack>

                            <Separator />

                            <Box as="form" onSubmit={handleSubmit(onLogin)}>
                                <VStack gap={4} align="stretch">
                                    <Field.Root required>
                                        <Field.Label fontWeight="medium" display="flex" alignItems="center" gap={2}>
                                            <User size={16} /> Usuário
                                        </Field.Label>
                                        <Input
                                            {...register('username', { required: true })}
                                            placeholder="Seu usuário"
                                            bg="white"
                                        />
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label fontWeight="medium" display="flex" alignItems="center" gap={2}>
                                            <Lock size={16} /> Senha
                                        </Field.Label>
                                        <Input
                                            {...register('password', { required: true })}
                                            type="password"
                                            placeholder="Sua senha"
                                            bg="white"
                                        />
                                    </Field.Root>

                                    <Button
                                        type="submit"
                                        colorPalette="blue"
                                        width="full"
                                        loading={isSubmitting}
                                        mt={2}
                                    >
                                        <LogIn size={18} style={{ marginRight: '8px' }} /> Entrar
                                    </Button>
                                </VStack>
                            </Box>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </Container>
        </Box>
    );
}
