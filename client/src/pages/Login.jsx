import { useState } from 'react';
import {useAuth} from '../context/AuthContext';
import { Link } from "react-router";
import './auth.css';

export default function Login () {
    const {login, loginWithGoogle} = useAuth();
    const [formData, setFormData] = useState({
        email:"",
        password:""
    });
    const [error, setError] = useState("");
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev)=>({
            ...prev,
            [name]: value
        }));
    }
    const handleSubmit=async (e)=> {
        e.preventDefault();
        setError("");
        const {error: nextError} = await login(formData.email, formData.password);
        if(nextError){
            setError(nextError.message || "Could not sign in.");
        }
    }
    return(
    <div className="auth">
        <div className="auth__hero">
            <img className="auth__bot" src="/chatbot_icon.png" alt="" />
        </div>
        <h1 className="auth__title">Sign in</h1>
        {error && <p className="auth__error">{error}</p>}
        <form className="auth__form" onSubmit={handleSubmit}>
           <label htmlFor='email'>Email</label>
           <input type="email" id='email' name='email' onChange={handleChange} value={formData.email} autoComplete="email"></input>

           <label htmlFor='password'>Password</label>
           <input type="password" id='password' name='password' onChange={handleChange} value={formData.password} autoComplete="current-password"></input>

           <button type="submit">Sign in</button>
        </form>

        <p className="auth__split">or</p>

        <div className="auth__alt">
            <button className="auth__secondary" type="button" onClick={()=> loginWithGoogle()}>Continue with Google</button>
            <p className="auth__link">No account? <Link to="/signup">Sign up</Link></p>
        </div>
    </div>)
}
