class UserModel {
    constructor(name, password, aadhar, pan, ration) {
        this.name = name;
        this.password = password;
        this.aadhar = aadhar;
        this.pan = pan;
        this.ration = ration;
        this.createdAt = new Date().toISOString(); // Timestamp
    }
}

module.exports = UserModel;
