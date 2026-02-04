import { ref, onMounted, onUnmounted } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';

export function useSSE() {
    const isConnected = ref(false);
    let eventSource: EventSource | null = null;

    const queryClient = useQueryClient();

    const connect = () => {
        // Usamos la URL directa del BFF
        const url = 'http://localhost:4000/api/v1/events';
        console.log('🔌 SSE: Connecting to', url);

        eventSource = new EventSource(url);

        eventSource.onopen = () => {
            isConnected.value = true;
            console.log('✅ SSE: Connected successfully!');
        };

        eventSource.onmessage = (e) => {
            // Evento genérico (ping/sistema)
            try {
                const data = JSON.parse(e.data);
                console.log('📨 SSE Message:', data);
            } catch {
                console.log('📨 SSE Message (raw):', e.data);
            }
        };

        // Eventos específicos
        eventSource.addEventListener('plate:prepared', (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            console.log('🍳 SSE EVENT RECEIVED: plate:prepared', data);

            // Invalidar queries relevantes
            console.log('🔄 Invalidating queries...');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['kitchen'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        });

        eventSource.addEventListener('purchase:completed', (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            console.log('🛒 SSE EVENT RECEIVED: purchase:completed', data);

            console.log('🔄 Invalidating queries (purchase:completed)...');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        });

        eventSource.onerror = (err) => {
            console.error('❌ SSE Connection Error:', err);
            isConnected.value = false;
            eventSource?.close();
        };
    };

    onMounted(() => {
        connect();
    });

    onUnmounted(() => {
        if (eventSource) {
            console.log('🔌 SSE: Disconnecting...');
            eventSource.close();
        }
    });

    return { isConnected };
}
