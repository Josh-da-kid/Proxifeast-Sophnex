export const actions = {
	
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);
        console.log('createDish called');
		console.log(data);

		 
       
    }

}