import Head from 'next/head';

// Components & Hooks
import Sidebar from '../../components/ui/Sidebar';
import StudentLoginForm from '../../components/ui/StudentLoginForm';
import StudentPageShell from '../../components/ui/StudentPageShell';
import { useStudentLogin } from '../../hooks/useStudentLogin';

const StudentLoginPage = () => {
  const loginState = useStudentLogin();

  return (
    <StudentPageShell
      sidebar={(
        <Sidebar 
          title="Portale Studenti" 
          description="Accedi per votare alle elezioni attive e consultare il tuo storico." 
          variant="student"
        />
      )}
    >
      <Head>
        <title>Accesso Studenti | VoteChain</title>
      </Head>

      <div className="p-8 md:p-12 flex items-center justify-center">
        <StudentLoginForm loginState={loginState} />
      </div>
    </StudentPageShell>
  );
};

export default StudentLoginPage;