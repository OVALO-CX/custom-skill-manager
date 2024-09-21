
import { useEffect, useState } from 'react';
import { authenticate } from './utils/genesysCloudUtils';
import CustomSkills from './components/custom-skills/CustomSkills';


function App() {
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    getPlatformClientData();
  }, []);

  async function getPlatformClientData() {
    await authenticate()
      .then(() => {
        setInitialized(true)
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  return (
    <>{
      initialized && 
      <CustomSkills />
      }
    </>
  );
}

export default App;
