const Footer = () => {
    return (
        <footer>
            <div className='mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6'>
                <p className='text-center font-medium text-balance'>
                    {`© ${new Date().getFullYear()}`}{' '}
                    Job Application Tracker. All rights reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer
