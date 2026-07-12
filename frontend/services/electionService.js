const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

const electionService = {
    async getElections() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/student/elections`, {
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.status === 401) {
                throw new Error('Non autorizzato');
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Errore nel recupero elezioni');
            return data;
        } catch (error) {
            console.error("Errore Election Service:", error);
            throw error;
        }
    },

    async getElectionDetails(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/student/elections/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Errore nel recupero dettagli elezione');
            return data;
        } catch (error) {
            console.error("Errore Election Details:", error);
            throw error;
        }
    }
};

export default electionService;
