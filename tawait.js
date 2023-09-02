    const waitConnection = () => {
        return new Promise((resolve, reject) => {
            let i = 0;
            const repeatFct = async () => {
                await setTimeout(() => {
                    i += 1;
                    if (i >= 10) {
                        reject()
                    }
                    else if(!this.client.connected) {
                        repeatFct()
                    }
                    else {
                        resolve()
                    }
                }, 1000);
            };
            repeatFct();
        })
    };
