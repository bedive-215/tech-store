import UserService from "../services/user.service.js";

export const getUserInfo = async (req, res, next) => {
    try {
        const id = req.user.id;
        const result = await UserService.getUserInfo(id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const updateUserInfo = async (req, res, next) => {
    try {
        const data = {
            full_name: req.body.full_name,
            phone_number: req.body.phone_number,
            date_of_birth: req.body.date_of_birth,
            avatar: req.file // từ multer
        };

        const result = await UserService.updateUserInfo(req.user.id, data);

        return res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Update user error:', error);
        next(error); // Chuyển error sang error handler
    }
};


export const getUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await UserService.getUserById(id);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export const getListOfUser = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role = req.query.role || 'user';
        const search = req.query.search || '';

        const result = await UserService.getListOfUser(page, limit, role, search);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const result = await UserService.deleteUser(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
}