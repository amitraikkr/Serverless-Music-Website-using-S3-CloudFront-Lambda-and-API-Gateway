from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_iam as iam,
    RemovalPolicy,
    Duration
)
from constructs import Construct

class MusicAppStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        music_bucket = s3.Bucket(
            self,
            "id",
            bucket_name = "christmasmusic2024",
            access_control = s3.BucketAccessControl.PRIVATE,
            encryption = s3.BucketEncryption.S3_MANAGED,
            versioned = False,
            block_public_access = s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY
        )

        bucket_policy = iam.PolicyStatement(
            effect = iam.Effect.ALLOW,
            resources = [f"{music_bucket.bucket_arn}/*"],
            actions = [
                "s3:GetObject",
                "s3:PutObject"
            ],
            principals = [iam.AccountPrincipal("886436951561")]
        )

        music_bucket.add_to_resource_policy(bucket_policy)

        bucket_name = 'christmasmusic2024'

        presigned_lambda = _lambda.Function(self,
            "GeneratePresignedUrlLambda",
            runtime=_lambda.Runtime.NODEJS_18_X,
            handler='index.handler',
            code=_lambda.Code.from_asset('lambda'), 
            environment={
                'BUCKET_NAME': bucket_name,
            },
            memory_size=512,
            timeout=Duration.seconds(30)
        )

        # Grant Lambda permissions to access S3
        music_bucket.grant_read(presigned_lambda)

        presigned_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["s3:GetObject", "s3:ListBucket"],
            resources=[f"arn:aws:s3:::{bucket_name}", f"arn:aws:s3:::{bucket_name}/*"]
        ))

        # Create API Gateway and integrate it with the Lambda
        api = apigw.LambdaRestApi(
            self, 'PresignedUrlApi',
            handler=presigned_lambda,
            proxy=False  # Allows for more control over routes
        )

        # Define the /songs resource
        songs_resource = api.root.add_resource('songs')

        # # Add GET method to the /songs resource
        # songs_resource.add_method('GET')  # GET /songs


        # Add GET method to the /songs resource with CORS enabled
        songs_resource.add_method(
            'GET',  # HTTP method
            apigw.LambdaIntegration(presigned_lambda),
            method_responses=[
                {
                    'statusCode': '200',
                    'responseParameters': {
                        'method.response.header.Access-Control-Allow-Origin': True,
                        'method.response.header.Access-Control-Allow-Methods': True,
                        'method.response.header.Access-Control-Allow-Headers': True,
                    }
                }
            ]
        )

        # Enable CORS by adding OPTIONS method
        songs_resource.add_method(
            'OPTIONS',
            apigw.MockIntegration(
                integration_responses=[{
                    'statusCode': '200',
                    'responseParameters': {
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                        'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
                        'method.response.header.Access-Control-Allow-Headers': "'Content-Type'",
                    },
                }],
                passthrough_behavior=apigw.PassthroughBehavior.WHEN_NO_MATCH,
                request_templates={"application/json": "{\"statusCode\": 200}"}
            ),
            method_responses=[{
                'statusCode': '200',
                'responseParameters': {
                    'method.response.header.Access-Control-Allow-Origin': True,
                    'method.response.header.Access-Control-Allow-Methods': True,
                    'method.response.header.Access-Control-Allow-Headers': True,
                }
            }]
        )
        
