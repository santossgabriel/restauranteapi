namespace RestauranteApi.DTO
{
  public class Response
  {
    public int StatusCode { get; set; }
    public string Message { get; set; }
    public object Data { get; set; }
    public System.Exception Exception { get; set; }

    public Response()
    {
      StatusCode = 200;
    }
  }
}