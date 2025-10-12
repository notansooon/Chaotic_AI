import { authClient } from "./auth-client"

const getSession = async () => {
    const {data: session } = await authClient.getSession()
    

}
