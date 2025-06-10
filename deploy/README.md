# LGM Skating E-commerce Backend Deployment

This folder contains the deployment package for the LGM Skating E-commerce backend application.

## Deployment Instructions for AWS Elastic Beanstalk

1. Sign in to the AWS Management Console
2. Go to the Elastic Beanstalk service
3. Click "Create Application"
4. Enter "LGM-Skating-Backend" as the application name
5. Select "Node.js" as the platform
6. Upload this deployment package (zip file)
7. Click "Create application"

## Environment Variables to Configure

Make sure to configure these environment variables in the Elastic Beanstalk environment:

- `PORT`: 5000
- `MONGODB_URI`: mongodb+srv://dwinnovationpvtltd:SMG6abYdo4vDcQfp@cluster0.b2zhwsy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
- `JWT_SECRET`: A secure random string for JWT token generation
- `JWT_EXPIRE`: 7d
- `NODE_ENV`: production
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

## Post-Deployment Steps

1. Test the complete application flow
2. Configure your frontend to use the new backend URL
3. Set up monitoring for your AWS instance