import { useState } from 'react';
import './App.css'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login';
import Signup from './pages/Signup';
import Homepage from './pages/Homepage';

function App() {
  const {user, loading} = useAuth();
  const [page, setPage]  = useState('login');


  return (
    <div>
      {loading && 
        <div>
          Loading
        </div>
      }

      {
        user ?
         <Homepage>
         </Homepage>
        :
        <div>
          {page === "signup" ? 
          <>
            <Signup/>
            <button onClick={()=> {setPage('login')}}>Login</button>
          </> 
          : 
          <>
            <Login></Login>
             <button onClick={()=> {setPage('signup')}}>Signup</button>
          </>}
          
        </div>

        

      }
    </div>
  )
}

export default App
