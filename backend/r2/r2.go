package r2

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var r2Client *s3.Client

func InitR2() {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("auto"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			os.Getenv("R2_ACCESS_KEY_ID"),
			os.Getenv("R2_SECRET_ACCESS_KEY"),
			"",
		)),
	)
	if err != nil {
		panic(err)
	}

	r2Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(os.Getenv("R2_ENDPOINT"))
		o.UsePathStyle = true
	})
}

func UploadFile(ctx context.Context, key string, file io.Reader) error {
	_, err := r2Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(os.Getenv("R2_BUCKET")),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String("application/java-archive"),
	})
	return err
}

func GetSignedURL(ctx context.Context, key string, filename string) (string, error) {
	disposition := fmt.Sprintf("attachment; filename=\"%s\"", filename)
	presignClient := s3.NewPresignClient(r2Client)
	resp, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket:                  aws.String(os.Getenv("R2_BUCKET")),
		Key:                     aws.String(key),
		ResponseContentDisposition: aws.String(disposition),
	}, s3.WithPresignExpires(15*time.Minute))
	if err != nil {
		return "", err
	}
	return resp.URL, nil
}

func DeleteFile(ctx context.Context, key string) error {
	_, err := r2Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(os.Getenv("R2_BUCKET")),
		Key:    aws.String(key),
	})
	return err
}
