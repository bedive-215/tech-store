import { Router } from "express";

import routerAuth from './auth.route.js';
import route from "./auth.route.js";

route.use('/auth', routerAuth);

export default route;