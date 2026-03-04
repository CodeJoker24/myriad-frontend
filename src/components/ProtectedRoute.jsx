import {Navigate, Outlet} from "react-router-dom"



export const ProtectedRoute = ({children}) => {
 const user = JSON.parse(localStorage.getItem('user'));
    const session = localStorage.getItem('session');
    if(!user || !session){
        return <Navigate to="/admin/signin" replace />;
    }

    return children
}
