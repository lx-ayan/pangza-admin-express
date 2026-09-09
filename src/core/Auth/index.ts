import { NextFunction } from "express";

const userMap = {}

class Auth {
    static login(userId: string | number) {

    }
}

export default (req: Request, res: Response, next: NextFunction) => {
    console.log(req, '=============');
    const random = Math.random();
    if (random > 0.5) {
        //@ts-ignore
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};