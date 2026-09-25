import './App.css'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login';
import Signup from './pages/Signup';
import {Homepage} from './pages/homepage/Homepage';
import {Route, Routes, Navigate} from 'react-router'
import Loader from './components/Loader/Loader';

function App() {
  const {user, loading,logout} = useAuth();
  if(loading) {
    return (
      <div className="app app--loading">
        <Loader label="Loading" />
      </div>
    );
  }


  return (//replace: deletes the original visit from the browswer's history stack.

    <div className='app'>
      <header className='app__header'>
        <span className="app__title">repo-recall</span>
        {user && (
          <button className="app__logout" type="button" onClick={logout}>
            Log out
          </button>
        )}
      </header>

      <main className="app__main">

        <Routes>
          <Route path='/login'  element={user ? <Navigate to="/" replace />: <Login/>} />  

          <Route path='/signup' element={user ? <Navigate to='/' replace/>  : <Signup/>} />

          <Route path='/' element={user? <Homepage/> : <Navigate to="/login" replace />} />
          <Route path='/chat' element={<Navigate to="/" replace/> }/>

          <Route path='*' element={<Navigate to="/" replace/>}/>

        </Routes>
      </main>

    </div>

    
    
   
  )
}

export default App
/**
 *  <div>
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
 * 
 */