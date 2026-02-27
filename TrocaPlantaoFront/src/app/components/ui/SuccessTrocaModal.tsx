'use client';

import {
    Dialog,
    Portal,
    Button,
    VStack,
    Heading,
    Text,
    HStack
} from '@chakra-ui/react';
import { useClipboard } from '@chakra-ui/react';

interface Props {
    open: boolean;
    onClose: () => void;
    trocaId: string | null;
}

export default function SuccessTrocaDialog({
    open,
    onClose,
    trocaId,
}: Props) {
    const clipboard = useClipboard({ value: trocaId ?? '' });

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
            <Portal>
                <Dialog.Backdrop bg="green.600" />

                <Dialog.Positioner>
                    <Dialog.Content
                        bg="transparent"
                        shadow="none"
                        maxW="100vw"
                        h="100vh"
                    >
                        <VStack
                            h="100%"
                            justify="center"
                            align="center"
                            gap={6}
                            textAlign="center"
                        >
                            <Heading
                                fontSize={{ base: '3xl', md: '6xl' }}
                                color="white"
                                fontWeight="900"
                            >
                                ✅ Troca criada com sucesso!
                            </Heading>

                            <Text fontSize="xl" color="whiteAlpha.800">
                                ID da troca:
                            </Text>

                            <Heading
                                fontSize={{ base: '2xl', md: '5xl' }}
                                color="white"
                                bg="whiteAlpha.200"
                                px={6}
                                py={4}
                                borderRadius="md"
                            >
                                {trocaId}
                            </Heading>

                            <HStack gap={3}>
                                <Button size="lg" variant="outline" onClick={clipboard.copy}>
                                    {clipboard.copied ? 'Copiado!' : 'Copiar ID'}
                                </Button>

                                <Button size="lg" colorPalette="green" onClick={onClose}>
                                    Fechar
                                </Button>
                            </HStack>
                        </VStack>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}